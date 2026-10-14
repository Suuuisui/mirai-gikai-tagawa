/**
 * トップページの注目の議案・タグ枠の固定が、前の会期の議案のままになっていないかを
 * 本番DBの設定と生成済み CSV（最新の会期の議案）で照らし合わせる【田川市専用】
 *
 * 実行方法（tagawa:build-csv の実行後、detect-changes の前に）:
 *   SUPABASE_URL=… SUPABASE_SECRET_KEY=… \
 *   pnpm --filter @mirai-gikai/seed tagawa:check-homepage-curation -- --out <作業ディレクトリ>
 *
 * - 注目・固定は admin の「トップページ編集」（または scripts/set-homepage-curation.mjs）で
 *   人が決め、会期が変わっても自動では入れ替わらない。最新の会期の議案が1件も入っていない枠を
 *   <out>/stale-homepage-curation.json に書き、detect-council-changes.ts が Issue に載せる
 * - 最新の会期は CSV（作業ツリー）から決めるので、その日に取り込んだばかりの会期も対象になる
 * - DB の接続情報が無いとき・読めなかったときは検出を行わず、警告だけ残す
 */

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import {
  type CurationBillRow,
  type CurationSessionRow,
  findStaleHomepageCuration,
  type HomepageCurationState,
  parseOutDir,
  type StaleHomepageCuration,
} from "./council-update-utils";

const CSV_DIR = path.join(import.meta.dirname, "../csv/data");

function readCsv(file: string): Record<string, string>[] {
  return parse(readFileSync(path.join(CSV_DIR, file), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  });
}

/** 生成済み CSV の会期と議案（議案ごとのタグ付き） */
function loadSessionsAndBills(): {
  sessions: CurationSessionRow[];
  bills: CurationBillRow[];
} {
  const sessions = readCsv("diet_sessions_rows.csv").map((row) => ({
    id: row.id,
    key: row.slug,
    name: row.name,
    startDate: row.start_date,
  }));
  const tagIdsByBillId = new Map<string, string[]>();
  for (const row of readCsv("bills_tags_rows.csv")) {
    tagIdsByBillId.set(row.bill_id, [...(tagIdsByBillId.get(row.bill_id) ?? []), row.tag_id]);
  }
  const bills = readCsv("bills_rows.csv")
    .filter((row) => row.publish_status === "published")
    .map((row) => ({
      id: row.id,
      sessionId: row.diet_session_id,
      tagIds: tagIdsByBillId.get(row.id) ?? [],
    }));
  return { sessions, bills };
}

/** 本番DBの注目の議案・トップに出すタグ・タグ枠の固定 */
async function loadCuration(): Promise<HomepageCurationState> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [featured, tags, pins] = await Promise.all([
    supabase
      .from("bills")
      .select("id")
      .eq("is_featured", true)
      .order("featured_priority", { ascending: true }),
    supabase
      .from("tags")
      .select("id, label")
      .not("featured_priority", "is", null)
      .order("featured_priority", { ascending: true }),
    supabase
      .from("bills_tags")
      .select("bill_id, tag_id")
      .not("pinned_priority", "is", null)
      .order("pinned_priority", { ascending: true }),
  ]);
  for (const [table, result] of [
    ["bills", featured],
    ["tags", tags],
    ["bills_tags", pins],
  ] as const) {
    if (result.error) throw new Error(`${table} の取得に失敗: ${result.error.message}`);
  }
  const pinRows = pins.data ?? [];
  return {
    featuredBillIds: (featured.data ?? []).map((row) => row.id),
    tags: (tags.data ?? []).map((tag) => ({
      id: tag.id,
      label: tag.label,
      pinnedBillIds: pinRows.filter((pin) => pin.tag_id === tag.id).map((pin) => pin.bill_id),
    })),
  };
}

async function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  let stale: StaleHomepageCuration | null = null;
  try {
    const { sessions, bills } = loadSessionsAndBills();
    stale = findStaleHomepageCuration(await loadCuration(), sessions, bills);
    console.log(
      stale === null
        ? "トップページの注目・固定には、最新の会期の議案が入っています"
        : `トップページの注目・固定が前の会期のままの枠（最新の会期: ${stale.sessionName}）: ${stale.slots.join("、")}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendFileSync(
      path.join(outDir, "warnings.txt"),
      `トップページの注目・固定の確認ができませんでした（${message}）\n`,
      "utf-8"
    );
    console.warn(message);
  }
  writeFileSync(
    path.join(outDir, "stale-homepage-curation.json"),
    `${JSON.stringify(stale, null, 2)}\n`,
    "utf-8"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
