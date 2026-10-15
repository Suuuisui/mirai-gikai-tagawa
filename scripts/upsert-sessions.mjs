/**
 * 生成済みCSV（packages/seed/csv/data）から、指定した会期（slug）の
 * diet_sessions / tags / bills / bill_contents / bills_tags を差分投入する。
 *
 * `pnpm seed:csv` は対象テーブルを全消去してから入れ直すため本番では使えない
 * （他会期のデータや admin での編集を壊す）。会期を追加・更新したいときはこれを使う。
 * IDは build-csv.ts が会期キー＋議案番号から決定的に採番するため、再実行しても重複しない。
 *
 * 上書きの範囲:
 * - diet_sessions / bill_contents: CSV の内容で更新する（解説文は
 *   packages/seed/tagawa/bill-descriptions*.ts が正なので、CSV で上書きしてよい）。
 *   ただし admin で直した可能性のある差分（DB 値が CSV と異なる行）は件数と内容を表示する
 * - bills_tags: 新規の議案、またはタグが1件も付いていない議案にだけ追加する。
 *   既にタグがある議案は admin で整理済みとみなし触らない（外したタグが復活しない）
 * - bills: 新規の行は CSV のまま挿入。既存の行は admin で管理する列
 *   （注目・公開状態・サムネイル・ナレッジ等）を除いて更新する。
 *   name / status / status_note / submitted_date は公式情報が正なので CSV で更新するが、
 *   DB 値が CSV と異なる場合は上書き前に差分を表示する
 * - tags: 会期をまたいで共有され admin で説明文を編集するため、無い行だけ挿入する
 * - diet_sessions.is_active（admin の会期一覧で「アクティブ」表示する会期。web は参照しない）
 *   は1件だけが true になるよう、投入する会期に true があれば admin と同じ
 *   DB関数 set_active_diet_session で他の会期の true を落とす
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
  "thumbnail_url",
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

/**
 * 指定した列の値で絞り込んで全件取得する。
 * Supabase は1回の応答が max_rows（既定1000）で黙って切れ、.in() は URL 長に限りがあるため、
 * 値を100件ずつに分けて .range() でページングする。
 */
async function fetchAllIn(table, columns, filterColumn, values) {
  const rows = [];
  for (let i = 0; i < values.length; i += 100) {
    const chunk = values.slice(i, i + 100);
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .in(filterColumn, chunk)
        .order(filterColumn)
        .range(from, from + 999);
      if (error) {
        console.error(`${table} の既存行の確認に失敗: ${error.message}`);
        process.exit(1);
      }
      rows.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
    }
  }
  return rows;
}

const normalize = (value) => (value === undefined || value === null ? null : String(value));
const normalizeDate = (value) => (value ? String(value).slice(0, 10) : null);

/** DB の既存値と CSV の値が異なる行を表示する（admin で直した値を上書きするかもしれないため） */
function reportDifferences(label, pairs, columns) {
  const diffs = [];
  for (const { current, incoming } of pairs) {
    for (const column of columns) {
      const a = column === "submitted_date" ? normalizeDate(current[column]) : normalize(current[column]);
      const b = column === "submitted_date" ? normalizeDate(incoming[column]) : normalize(incoming[column]);
      if (a !== b) diffs.push({ id: current.id, column, from: a, to: b });
    }
  }
  if (diffs.length === 0) return;
  console.warn(`注意: ${label} で DB の値と異なる箇所が ${diffs.length} 件あり、CSV の値で上書きします`);
  for (const d of diffs.slice(0, 30)) {
    const cut = (v) => (v === null ? "null" : v.length > 40 ? `${v.slice(0, 40)}…` : v);
    console.warn(`  ${d.id} ${d.column}: ${cut(d.from)} → ${cut(d.to)}`);
  }
  if (diffs.length > 30) console.warn(`  …ほか ${diffs.length - 30} 件`);
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

const existingBills = await fetchAllIn(
  "bills",
  "id,name,status,status_note,submitted_date",
  "id",
  [...billIds]
);
const existingBillsById = new Map(existingBills.map((b) => [b.id, b]));
const newBills = bills.filter((b) => !existingBillsById.has(b.id));
const updatedBills = bills
  .filter((b) => existingBillsById.has(b.id))
  .map((b) => omit(b, ADMIN_MANAGED_BILL_COLUMNS));
reportDifferences(
  "bills",
  updatedBills.map((b) => ({ current: existingBillsById.get(b.id), incoming: b })),
  ["name", "status", "status_note", "submitted_date"]
);

const existingContents = await fetchAllIn(
  "bill_contents",
  "id,bill_id,title,summary,content",
  "bill_id",
  [...billIds]
);
const existingContentsById = new Map(existingContents.map((c) => [c.id, c]));
reportDifferences(
  "bill_contents",
  contents
    .filter((c) => existingContentsById.has(c.id))
    .map((c) => ({ current: existingContentsById.get(c.id), incoming: c })),
  ["title", "summary", "content"]
);

// タグが既に付いている既存議案は admin で整理済みとみなし、bills_tags を触らない
const taggedBillIds = new Set(
  (await fetchAllIn("bills_tags", "bill_id,tag_id", "bill_id", [...billIds])).map((t) => t.bill_id)
);
const billsTagsToInsert = billsTags.filter(
  (t) => !(existingBillsById.has(t.bill_id) && taggedBillIds.has(t.bill_id))
);
console.log(
  `bills_tags: 既にタグのある既存議案の ${billsTags.length - billsTagsToInsert.length} 件は保持`
);

await upsert("diet_sessions", sessions, { onConflict: "id" });
const activeSession = sessions.find((s) => s.is_active);
if (activeSession) {
  const { error } = await supabase.rpc("set_active_diet_session", {
    target_session_id: activeSession.id,
  });
  if (error) {
    console.error(`diet_sessions の is_active 更新に失敗: ${error.message}`);
    process.exit(1);
  }
  console.log(`diet_sessions: ${activeSession.slug} 以外の is_active を解除`);
}
await upsert("tags", tags, { onConflict: "id", ignoreDuplicates: true });
await upsert("bills", newBills, { onConflict: "id" });
await upsert("bills", updatedBills, { onConflict: "id" });
await upsert("bill_contents", contents, { onConflict: "id" });
await upsert("bills_tags", billsTagsToInsert, { onConflict: "bill_id,tag_id" });
