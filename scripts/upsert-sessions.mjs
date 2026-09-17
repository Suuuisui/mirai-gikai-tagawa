/**
 * 生成済みCSV（packages/seed/csv/data）から、指定した会期（slug）の
 * diet_sessions / tags / bills / bill_contents / bills_tags を差分投入する。
 *
 * `pnpm seed:csv` は対象テーブルを全消去してから入れ直すため本番では使えない
 * （他会期のデータや admin での編集を壊す）。会期を追加・更新したいときはこれを使う。
 * IDは build-csv.ts が会期キー＋議案番号から決定的に採番するため、再実行しても重複しない。
 *
 * 上書きの範囲:
 * - diet_sessions / bill_contents / bills_tags: CSV の内容で更新する（解説文は
 *   packages/seed/tagawa/bill-descriptions*.ts が正なので、CSV で上書きしてよい）
 * - bills: 新規の行は CSV のまま挿入。既存の行は admin で管理する列
 *   （注目・公開状態・ナレッジ等）を除いて更新する
 * - tags: 会期をまたいで共有され admin で説明文を編集するため、無い行だけ挿入する
 *
 * 使い方:
 *   pnpm --filter @mirai-gikai/seed tagawa:build-csv
 *   npx dotenv-cli -e <envファイル> -- node scripts/upsert-sessions.mjs r8-5-rinji r8-6-teirei
 *   DRY_RUN=1 を付けると投入せずに件数だけ表示する
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SEED_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages/seed"
);
// csv-parse は seed パッケージの依存なので、そこから解決する
const { parse } = createRequire(path.join(SEED_DIR, "package.json"))(
  "csv-parse/sync"
);
const CSV_DIR = path.join(SEED_DIR, "csv/data");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  process.exit(1);
}
const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error("usage: node scripts/upsert-sessions.mjs <session-slug> [...]");
  process.exit(1);
}

/** jsonb 列（CSVにはJSON文字列で入っている） */
const JSON_COLUMNS = new Set(["explanation_material_urls", "member_votes", "sponsors"]);
/** admin 画面で編集する列。既存の bills 行ではCSVで上書きしない */
const ADMIN_MANAGED_BILL_COLUMNS = [
  "is_featured",
  "featured_priority",
  "publish_status",
  "share_thumbnail_url",
  "knowledge_source",
  "use_knowledge_source_in_chat",
];

function castValue(file, column, value) {
  if (value === "") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (JSON_COLUMNS.has(column)) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`${file} の ${column} 列のJSONを読めません: ${error.message}`);
    }
  }
  return value;
}

function readRows(file) {
  const records = parse(readFileSync(path.join(CSV_DIR, file), "utf8"), {
    columns: true,
    skip_empty_lines: true,
  });
  return records.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([column, value]) => [column, castValue(file, column, value)])
    )
  );
}

function omit(row, columns) {
  return Object.fromEntries(Object.entries(row).filter(([column]) => !columns.includes(column)));
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table, rows, options) {
  if (rows.length === 0) {
    console.log(`${table}: 0件`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, options);
  if (error) {
    console.error(`${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${table}: ${rows.length}件 ${options.ignoreDuplicates ? "挿入（既存は保持）" : "upsert"}`);
}

async function existingIds(table, ids) {
  const { data, error } = await supabase.from(table).select("id").in("id", ids);
  if (error) {
    console.error(`${table} の既存行の確認に失敗: ${error.message}`);
    process.exit(1);
  }
  return new Set((data ?? []).map((row) => row.id));
}

const sessions = readRows("diet_sessions_rows.csv").filter((s) => slugs.includes(s.slug));
const missing = slugs.filter((slug) => !sessions.some((s) => s.slug === slug));
if (missing.length > 0) {
  console.error(`CSVに無い会期: ${missing.join(", ")}`);
  process.exit(1);
}
const sessionIds = new Set(sessions.map((s) => s.id));
const bills = readRows("bills_rows.csv").filter((b) => sessionIds.has(b.diet_session_id));
const billIds = new Set(bills.map((b) => b.id));
const contents = readRows("bill_contents_rows.csv").filter((c) => billIds.has(c.bill_id));
const billsTags = readRows("bills_tags_rows.csv").filter((t) => billIds.has(t.bill_id));
const tagIds = new Set(billsTags.map((t) => t.tag_id));
const tags = readRows("tags_rows.csv").filter((t) => tagIds.has(t.id));

console.log(
  `対象: ${sessions.map((s) => `${s.slug}（${s.name}）`).join(", ")} / 議案${bills.length}件`
);
if (process.env.DRY_RUN) {
  console.log("DRY_RUN のため投入しません");
  process.exit(0);
}

const knownBillIds = await existingIds("bills", [...billIds]);
const newBills = bills.filter((b) => !knownBillIds.has(b.id));
const updatedBills = bills
  .filter((b) => knownBillIds.has(b.id))
  .map((b) => omit(b, ADMIN_MANAGED_BILL_COLUMNS));

await upsert("diet_sessions", sessions, { onConflict: "id" });
await upsert("tags", tags, { onConflict: "id", ignoreDuplicates: true });
await upsert("bills", newBills, { onConflict: "id" });
await upsert("bills", updatedBills, { onConflict: "id" });
await upsert("bill_contents", contents, { onConflict: "id" });
await upsert("bills_tags", billsTags, { onConflict: "bill_id,tag_id" });
