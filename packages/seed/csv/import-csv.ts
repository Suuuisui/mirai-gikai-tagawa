import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient, clearAllData, type AdminClient } from "../shared/helper";
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

/**
 * JSON配列文字列をPostgreSQL配列形式に変換する
 * 例: '["a","b","c"]' -> '{a,b,c}'
 *
 * オブジェクトを含む配列（例: bills.explanation_material_urls のような
 * jsonbカラム向けの '[{"label":...,"url":...}]'）はPostgreSQL配列ではなく
 * JSONとして挿入する必要があるため、パース済みの配列をそのまま返す
 * （supabase-jsがjsonbとしてシリアライズする）
 */
function convertJsonArrayToPostgresArray(value: string): string | unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.some((item) => typeof item === "object" && item !== null)) {
        return parsed;
      }
      const escaped = parsed.map((item) => {
        const str = String(item);
        // カンマ、ダブルクォート、バックスラッシュ、中括弧、空白を含む場合はクォート
        if (/[,"\\\{\}\s]/.test(str)) {
          return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        }
        return str;
      });
      return `{${escaped.join(",")}}`;
    }
  } catch {
    // JSON解析に失敗した場合は元の値を返す
  }
  return value;
}

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: (value) => {
      if (value === "") return null;
      // JSON配列形式の場合はPostgreSQL配列形式に変換
      if (value.startsWith("[") && value.endsWith("]")) {
        return convertJsonArrayToPostgresArray(value);
      }
      return value;
    },
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

async function importFromCsv() {
  const supabase = createAdminClient();
  const dataDir = path.join(import.meta.dirname, "data");

  console.log("🌱 Starting CSV import...");

  try {
    const { configSnapshots, questions: questionSnapshots } =
      await snapshotInterviewData(supabase);

    await clearAllData(supabase);

    const summary: Record<string, number> = {};
    let importedBills: BillInfo[] = [];
    let importedSessions: SessionInfo[] = [];

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
