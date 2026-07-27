import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient, clearAllData, type AdminClient } from "../shared/helper";
import { castCsvValue } from "./csv-value-cast";
import {
  type FeaturedBillSnapshot,
  resolveFeaturedBillUpdates,
} from "./featured-bills-restore";
import {
  billsTagsLinkKey,
  type PinnedTagSnapshot,
  resolvePinnedTagUpdates,
} from "./pinned-tags-restore";
import {
  type NewTagInfo,
  resolveTagSettingsUpdates,
  type TagSettingsSnapshot,
} from "./tag-settings-restore";
import {
  attachBillMatchKeys,
  buildBillIdToMatchKey,
  buildMatchKeyToBillId,
  filterQuestionsForRestoredConfigs,
  resolveRestoredConfigs,
  type BillInfo,
  type InterviewConfigRow,
  type InterviewConfigSnapshot,
  type InterviewQuestionRow,
  type SessionInfo,
} from "./interview-restore";

type TableName = keyof Database["public"]["Tables"];

interface CsvImportConfig {
  table: TableName;
  file: string;
}

const CSV_IMPORTS: CsvImportConfig[] = [
  { table: "diet_sessions", file: "diet_sessions_rows.csv" },
  { table: "tags", file: "tags_rows.csv" },
  { table: "bills", file: "bills_rows.csv" },
  { table: "bill_contents", file: "bill_contents_rows.csv" },
  { table: "bills_tags", file: "bills_tags_rows.csv" },
  { table: "interview_configs", file: "interview_configs_rows.csv" },
  { table: "interview_questions", file: "interview_questions_rows.csv" },
];

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: (value) => castCsvValue(value),
  });
  return records as T[];
}

/**
 * クリア前に interview_configs / interview_questions を、紐づく議案
 * （会期slug + 議案名）と一緒にスナップショットする。
 * CSVにはinterview系の再投入データが無い（田川市版では常に0件）ため、
 * このスナップショットが無いと clearAllData() で永久に消えてしまう。
 */
async function snapshotInterviewData(supabase: AdminClient): Promise<{
  configSnapshots: InterviewConfigSnapshot[];
  questions: InterviewQuestionRow[];
}> {
  const [billsResult, sessionsResult, configsResult] = await Promise.all([
    supabase.from("bills").select("id, name, diet_session_id"),
    supabase.from("diet_sessions").select("id, slug"),
    supabase.from("interview_configs").select("*"),
  ]);

  if (billsResult.error) {
    throw new Error(
      `Failed to snapshot bills for interview restore: ${billsResult.error.message}`
    );
  }
  if (sessionsResult.error) {
    throw new Error(
      `Failed to snapshot diet_sessions for interview restore: ${sessionsResult.error.message}`
    );
  }
  if (configsResult.error) {
    throw new Error(
      `Failed to snapshot interview_configs: ${configsResult.error.message}`
    );
  }

  const configs = (configsResult.data ?? []) as InterviewConfigRow[];
  const configIds = configs.map((c) => c.id);

  const questionsResult =
    configIds.length > 0
      ? await supabase
          .from("interview_questions")
          .select("*")
          .in("interview_config_id", configIds)
      : { data: [] as InterviewQuestionRow[], error: null };

  if (questionsResult.error) {
    throw new Error(
      `Failed to snapshot interview_questions: ${questionsResult.error.message}`
    );
  }

  const billIdToMatchKey = buildBillIdToMatchKey(
    (billsResult.data ?? []) as BillInfo[],
    (sessionsResult.data ?? []) as SessionInfo[]
  );
  const configSnapshots = attachBillMatchKeys(configs, billIdToMatchKey);

  return {
    configSnapshots,
    questions: (questionsResult.data ?? []) as InterviewQuestionRow[],
  };
}

/**
 * スナップショットを新しい bill_id に付け替えて interview_configs /
 * interview_questions を復元する。newBills/newSessions は CSV 再投入で
 * 実際にインポートされた bills / diet_sessions のレコード（このプロセス内で
 * 読み込んだもの）を渡す。
 */
async function restoreInterviewData(
  supabase: AdminClient,
  configSnapshots: InterviewConfigSnapshot[],
  questionSnapshots: InterviewQuestionRow[],
  newBills: BillInfo[],
  newSessions: SessionInfo[]
): Promise<{ restoredConfigs: number; restoredQuestions: number }> {
  const matchKeyToNewBillId = buildMatchKeyToBillId(newBills, newSessions);
  const { restored, skipped } = resolveRestoredConfigs(
    configSnapshots,
    matchKeyToNewBillId
  );

  if (restored.length > 0) {
    const { error } = await supabase
      .from("interview_configs")
      .insert(restored as never[]);
    if (error) {
      throw new Error(`Failed to restore interview_configs: ${error.message}`);
    }
  }

  const restoredConfigIds = new Set(restored.map((c) => c.id));
  const restoredQuestions = filterQuestionsForRestoredConfigs(
    questionSnapshots,
    restoredConfigIds
  );

  if (restoredQuestions.length > 0) {
    const { error } = await supabase
      .from("interview_questions")
      .insert(restoredQuestions as never[]);
    if (error) {
      throw new Error(
        `Failed to restore interview_questions: ${error.message}`
      );
    }
  }

  console.log(
    `\n🔄 インタビュー設定の復元: ${restored.length}件復元 / ${skipped.length}件スキップ`
  );
  for (const s of skipped) {
    console.warn(`  ⚠️ 復元できませんでした: "${s.name}" (id=${s.id}) — ${s.reason}`);
  }

  return {
    restoredConfigs: restored.length,
    restoredQuestions: restoredQuestions.length,
  };
}

/**
 * クリア前に admin画面で設定されたタグ枠のピン留め
 * （bills_tags.pinned_priority）を「タグラベル + 会期slug::議案名」で
 * スナップショットする。CSVのbills_tagsにはピン情報が無いため、
 * このスナップショットが無いと再シードで消えてしまう
 */
async function snapshotPinnedTags(
  supabase: AdminClient
): Promise<PinnedTagSnapshot[]> {
  const { data, error } = await supabase
    .from("bills_tags")
    .select(
      "pinned_priority, tags ( label ), bills ( id, name, diet_session_id, diet_sessions ( slug ) )"
    )
    .not("pinned_priority", "is", null);

  if (error) {
    throw new Error(`Failed to snapshot pinned tags: ${error.message}`);
  }

  const snapshots: PinnedTagSnapshot[] = [];
  for (const row of data ?? []) {
    const slug = row.bills?.diet_sessions?.slug;
    const name = row.bills?.name;
    const label = row.tags?.label;
    if (row.pinned_priority == null || !slug || !name || !label) continue;
    snapshots.push({
      tagLabel: label,
      billMatchKey: `${slug}::${name}`,
      pinned_priority: row.pinned_priority,
    });
  }
  return snapshots;
}

/**
 * スナップショットしたピン留めを、タグラベルと会期slug::議案名の一致で
 * 新しい bills_tags 行へ復元する。初回投入（スナップショット空）は何もしない
 */
async function restorePinnedTags(
  supabase: AdminClient,
  snapshots: PinnedTagSnapshot[],
  newTags: NewTagInfo[],
  newBills: BillInfo[],
  newSessions: SessionInfo[]
): Promise<void> {
  if (snapshots.length === 0) {
    return;
  }

  const { data: linkRows, error: linkError } = await supabase
    .from("bills_tags")
    .select("tag_id, bill_id");
  if (linkError) {
    throw new Error(
      `Failed to fetch bills_tags for pinned restore: ${linkError.message}`
    );
  }
  const existingLinkKeys = new Set(
    (linkRows ?? []).map((row) => billsTagsLinkKey(row.tag_id, row.bill_id))
  );

  const { restored, skipped } = resolvePinnedTagUpdates(
    snapshots,
    newTags,
    buildMatchKeyToBillId(newBills, newSessions),
    existingLinkKeys
  );

  for (const update of restored) {
    const { error } = await supabase
      .from("bills_tags")
      .update({ pinned_priority: update.pinned_priority } as never)
      .eq("tag_id", update.tag_id)
      .eq("bill_id", update.bill_id);
    if (error) {
      throw new Error(
        `Failed to restore pinned tag (tag=${update.tag_id}, bill=${update.bill_id}): ${error.message}`
      );
    }
  }

  console.log(
    `\n🔄 タグ枠ピン留めの復元: ${restored.length}件復元 / ${skipped.length}件スキップ`
  );
  for (const s of skipped) {
    console.warn(
      `  ⚠️ 復元できませんでした: "${s.tagLabel}" × "${s.billMatchKey}" — ${s.reason}`
    );
  }
}

/**
 * クリア前に admin画面で設定された「注目の議案」
 * （is_featured / featured_priority）をスナップショットする。
 * 再投入CSVには featured-bills-data.ts 由来の初期値が入っているが、
 * 本番ではadmin設定を正とするため、スナップショットがあればそちらで上書きする
 */
async function snapshotFeaturedBills(
  supabase: AdminClient
): Promise<FeaturedBillSnapshot[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("name, is_featured, featured_priority")
    .eq("is_featured", true);
  if (error) {
    throw new Error(`Failed to snapshot featured bills: ${error.message}`);
  }
  return (data ?? []) as FeaturedBillSnapshot[];
}

/**
 * スナップショットした注目の議案を、議案名一致で新しいbills行へ復元する。
 * スナップショットが空（初回投入・ローカル新規構築）の場合は何もせず、
 * CSVの初期値（featured-bills-data.ts）をそのまま生かす。
 * スナップショットがある場合はadmin設定を正とするため、先にCSV由来の
 * 注目フラグを全解除してから復元する
 */
async function restoreFeaturedBills(
  supabase: AdminClient,
  snapshots: FeaturedBillSnapshot[],
  newBills: BillInfo[]
): Promise<void> {
  if (snapshots.length === 0) {
    return;
  }

  const { error: resetError } = await supabase
    .from("bills")
    .update({ is_featured: false, featured_priority: null } as never)
    .eq("is_featured", true);
  if (resetError) {
    throw new Error(
      `Failed to reset featured bills before restore: ${resetError.message}`
    );
  }

  const { restored, skipped } = resolveFeaturedBillUpdates(
    snapshots,
    newBills.map((bill) => ({ id: bill.id, name: bill.name }))
  );

  for (const update of restored) {
    const { error } = await supabase
      .from("bills")
      .update({
        is_featured: update.is_featured,
        featured_priority: update.featured_priority,
      } as never)
      .eq("id", update.id);
    if (error) {
      throw new Error(
        `Failed to restore featured bill (id=${update.id}): ${error.message}`
      );
    }
  }

  console.log(
    `\n🔄 注目の議案の復元: ${restored.length}件復元 / ${skipped.length}件スキップ`
  );
  for (const s of skipped) {
    console.warn(`  ⚠️ 復元できませんでした: "${s.name}" — ${s.reason}`);
  }
}

/**
 * クリア前に admin画面で編集されたタグ設定（説明・トップページのセクション
 * 表示順 featured_priority）をスナップショットする
 */
async function snapshotTagSettings(
  supabase: AdminClient
): Promise<TagSettingsSnapshot[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("label, description, featured_priority");
  if (error) {
    throw new Error(`Failed to snapshot tag settings: ${error.message}`);
  }
  return (data ?? []) as TagSettingsSnapshot[];
}

/**
 * スナップショットしたタグ設定を、ラベル一致で新しいtags行へ復元する。
 * DB側（admin設定）がCSV初期値より優先される。初回投入（スナップショット空）は
 * 何もしない
 */
async function restoreTagSettings(
  supabase: AdminClient,
  snapshots: TagSettingsSnapshot[],
  newTags: NewTagInfo[]
): Promise<void> {
  if (snapshots.length === 0) {
    return;
  }

  const { restored, skipped } = resolveTagSettingsUpdates(snapshots, newTags);

  for (const update of restored) {
    const { error } = await supabase
      .from("tags")
      .update({
        description: update.description,
        featured_priority: update.featured_priority,
      } as never)
      .eq("id", update.id);
    if (error) {
      throw new Error(
        `Failed to restore tag settings (id=${update.id}): ${error.message}`
      );
    }
  }

  if (restored.length > 0 || skipped.length > 0) {
    console.log(
      `\n🔄 タグ設定の復元: ${restored.length}件復元 / ${skipped.length}件スキップ`
    );
  }
  for (const s of skipped) {
    console.warn(`  ⚠️ 復元できませんでした: "${s.label}" — ${s.reason}`);
  }
}

async function importFromCsv() {
  const supabase = createAdminClient();
  const dataDir = path.join(import.meta.dirname, "data");

  console.log("🌱 Starting CSV import...");

  try {
    const { configSnapshots, questions: questionSnapshots } =
      await snapshotInterviewData(supabase);
    const featuredSnapshots = await snapshotFeaturedBills(supabase);
    const tagSettingsSnapshots = await snapshotTagSettings(supabase);
    const pinnedTagSnapshots = await snapshotPinnedTags(supabase);

    await clearAllData(supabase);

    const summary: Record<string, number> = {};
    let importedBills: BillInfo[] = [];
    let importedSessions: SessionInfo[] = [];
    let importedTags: NewTagInfo[] = [];

    for (const config of CSV_IMPORTS) {
      console.log(`Importing ${config.table}...`);

      const csvPath = path.join(dataDir, config.file);
      const records = readCsv<Record<string, unknown>>(csvPath);

      const { data, error } = await supabase
        .from(config.table)
        .insert(records as never[])
        .select();

      if (error) {
        throw new Error(`Failed to import ${config.table}: ${error.message}`);
      }

      const count = data?.length ?? 0;
      summary[config.table] = count;
      console.log(`✅ Imported ${count} ${config.table}`);

      // interview_configs/interview_questions のbill_id付け替えに使うため、
      // 再投入されたbills/diet_sessionsを控えておく
      if (config.table === "bills") {
        importedBills = (data ?? []) as BillInfo[];
      }
      if (config.table === "diet_sessions") {
        importedSessions = (data ?? []) as SessionInfo[];
      }
      if (config.table === "tags") {
        importedTags = (data ?? []) as NewTagInfo[];
      }
    }

    const { restoredConfigs, restoredQuestions } = await restoreInterviewData(
      supabase,
      configSnapshots,
      questionSnapshots,
      importedBills,
      importedSessions
    );
    summary.interview_configs = restoredConfigs;
    summary.interview_questions = restoredQuestions;

    await restoreFeaturedBills(supabase, featuredSnapshots, importedBills);
    await restoreTagSettings(supabase, tagSettingsSnapshots, importedTags);
    await restorePinnedTags(
      supabase,
      pinnedTagSnapshots,
      importedTags,
      importedBills,
      importedSessions
    );

    console.log("\n🎉 CSV import completed successfully!");
    console.log("\n📊 Summary:");
    for (const [table, count] of Object.entries(summary)) {
      console.log(`  ${table}: ${count}`);
    }
  } catch (error) {
    console.error("❌ Error importing CSV:", error);
    process.exit(1);
  }
}

importFromCsv();
