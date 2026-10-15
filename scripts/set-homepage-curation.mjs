/**
 * トップページの並び（注目の議案・タグ別セクションの順・タグ枠に固定する議案）を
 * JSONの定義どおりに入れ替える。admin の「トップページ編集」（/homepage）で
 * 1件ずつ操作するのと同じ列を、まとめて更新するためのもの。
 *
 * 書き換える列（admin の保存処理と同じ）:
 * - bills.is_featured / bills.featured_priority（注目の議案。配列の順＝表示順）
 * - tags.featured_priority（タグ別セクション。配列の順＝表示順）
 * - bills_tags.pinned_priority（タグ枠の固定。配列の順＝表示順）
 *
 * 定義ファイルの形（--dump の出力と同じ形なので、控えをそのまま渡せば元に戻せる）:
 *   {
 *     "featuredBillIds": ["<議案ID>", ...],
 *     "tagIds": ["<タグID>", ...],
 *     "pinnedBillIdsByTagId": { "<タグID>": ["<議案ID>", ...] }
 *   }
 *   - 3つのキーはどれも省略でき、省略した項目は変更しない
 *   - 書いたキーは「その項目の全体」として扱う。載せなかった議案は注目から外れ、
 *     載せなかったタグはトップページに出なくなり、pinnedBillIdsByTagId に
 *     載せなかったタグの固定は解除される
 *   - "_" で始まるキー（"_comment" など）はメモとして無視する
 *
 * 使い方:
 *   # 現在の設定を書き出す（控え。投入はしない）
 *   npx dotenv-cli -e <envファイル> -- node scripts/set-homepage-curation.mjs --dump > backup.json
 *   # 変更内容を確認する（投入はしない）
 *   DRY_RUN=1 npx dotenv-cli -e <envファイル> -- node scripts/set-homepage-curation.mjs curation.json
 *   # 入れ替える。終わったら web の /api/revalidate で bills タグのキャッシュを消す
 *   npx dotenv-cli -e <envファイル> -- node scripts/set-homepage-curation.mjs curation.json
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/** タグ枠1つに出る議案の数（packages/shared/src/top-page/config.ts の BILLS_PER_TAG と同じ） */
const BILLS_PER_TAG = 3;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  process.exit(1);
}
const arg = process.argv[2];
if (!arg) {
  console.error("usage: node scripts/set-homepage-curation.mjs <定義.json> | --dump");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function select(table, columns, build = (query) => query) {
  const { data, error } = await build(supabase.from(table).select(columns));
  if (error) fail(`${table} の取得に失敗: ${error.message}`);
  return data ?? [];
}

async function update(table, values, build) {
  const { error } = await build(supabase.from(table).update(values));
  if (error) fail(`${table} の更新に失敗: ${error.message}`);
}

/** 現在の設定を、定義ファイルと同じ形で読む */
async function readCurrent() {
  const [featured, tags, pins] = await Promise.all([
    select("bills", "id,name,featured_priority", (q) =>
      q.eq("is_featured", true).order("featured_priority", { ascending: true })
    ),
    select("tags", "id,label,featured_priority", (q) =>
      q.not("featured_priority", "is", null).order("featured_priority", { ascending: true })
    ),
    select("bills_tags", "bill_id,tag_id,pinned_priority", (q) =>
      q.not("pinned_priority", "is", null).order("pinned_priority", { ascending: true })
    ),
  ]);
  const pinnedBillIdsByTagId = {};
  for (const pin of pins) {
    pinnedBillIdsByTagId[pin.tag_id] ??= [];
    pinnedBillIdsByTagId[pin.tag_id].push(pin.bill_id);
  }
  return {
    featuredBillIds: featured.map((bill) => bill.id),
    tagIds: tags.map((tag) => tag.id),
    pinnedBillIdsByTagId,
  };
}

function assertUnique(ids, label) {
  if (new Set(ids).size !== ids.length) fail(`${label} に同じIDが重複しています`);
}

const current = await readCurrent();

if (arg === "--dump") {
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

const DEFINITION_KEYS = ["featuredBillIds", "tagIds", "pinnedBillIdsByTagId"];

const next = JSON.parse(readFileSync(arg, "utf8"));
// キーの打ち間違いを「変更なし」として黙って通さない
const unknownKeys = Object.keys(next).filter(
  (name) => !name.startsWith("_") && !DEFINITION_KEYS.includes(name)
);
if (unknownKeys.length > 0) fail(`定義に知らないキーがあります: ${unknownKeys.join(", ")}`);
if (!DEFINITION_KEYS.some((name) => name in next)) {
  fail(`定義に ${DEFINITION_KEYS.join(" / ")} のどれもありません`);
}

const featuredBillIds = next.featuredBillIds ?? null;
const tagIds = next.tagIds ?? null;
// 固定は全体を入れ替える。いま固定があるのに定義に載っていないタグは解除する
const pinnedBillIdsByTagId = next.pinnedBillIdsByTagId
  ? {
      ...Object.fromEntries(Object.keys(current.pinnedBillIdsByTagId).map((tagId) => [tagId, []])),
      ...next.pinnedBillIdsByTagId,
    }
  : {};

// ── 検証（admin の保存処理と同じ条件） ──────────────────────
if (featuredBillIds) assertUnique(featuredBillIds, "featuredBillIds");
if (tagIds) assertUnique(tagIds, "tagIds");
for (const [tagId, billIds] of Object.entries(pinnedBillIdsByTagId)) {
  // 途中で失敗してもピンが全部消えないよう、先に新しい順位を書いてから外れた分を解除する
  for (const [index, billId] of billIds.entries()) {
    await update("bills_tags", { pinned_priority: index + 1 }, (q) =>
      q.eq("tag_id", tagId).eq("bill_id", billId)
    );
  }
  await update("bills_tags", { pinned_priority: null }, (q) => {
    const query = q.eq("tag_id", tagId).not("pinned_priority", "is", null);
    return billIds.length > 0 ? query.not("bill_id", "in", `(${billIds.join(",")})`) : query;
  });
}

console.log("更新しました。web の /api/revalidate で bills タグのキャッシュを消してください");
