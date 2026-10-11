/**
 * 委員会会議録データを committee_meetings テーブルへ投入する one-off スクリプト。
 *
 * 使い方:
 *   npx dotenv-cli -e .env -- node scripts/import-committee-meetings.mjs <records.json>
 *
 * 入力JSON: 以下の形式のレコード配列
 *   {
 *     committee_name, meeting_date(YYYY-MM-DD), title, headline, topics[],
 *     summary, key_points[], agenda_items[], attendees[], minutes_text,
 *     source_type("minutes"|"youtube"|"disclosure"), source_note, youtube_url,
 *     replaces_source_type（省略可）
 *   }
 *
 * (committee_name, meeting_date, source_type) の一意制約で upsert するため
 * 再実行しても重複しない。
 *
 * replaces_source_type を付けたレコードは「より正確な資料で作り直した記録」として扱う。
 * 同じ委員会・同じ日で、その出典（例: "youtube"）の行があれば、新しい行を足さずに
 * その行を書き換える（id＝ページのURLを変えないため）。たとえば、中継の文字起こしを
 * もとにしていた本会議の記録を、公開された会議録をもとに作り直すときに使う:
 *   { ..., "source_type": "minutes", "replaces_source_type": "youtube" }
 * 置き換える行が無ければ（すでに置き換え済みなど）通常どおり upsert する。
 *
 * DRY_RUN=1 を付けると投入せずに、何件を置き換え・upsert するかだけ表示する
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/import-committee-meetings.mjs <records.json>");
  process.exit(1);
}

const records = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(records)) {
  console.error("入力JSONはレコード配列である必要があります");
  process.exit(1);
}

const REQUIRED = ["committee_name", "meeting_date", "title", "source_type"];
for (const [i, r] of records.entries()) {
  for (const k of REQUIRED) {
    if (!r[k]) {
      console.error(`records[${i}] の必須フィールド ${k} がありません`);
      process.exit(1);
    }
  }
}

const supabase = createClient(url, key);

const toRow = (r) => ({
  committee_name: r.committee_name,
  meeting_date: r.meeting_date,
  title: r.title,
  headline: r.headline ?? null,
  topics: r.topics ?? [],
  summary: r.summary ?? null,
  key_points: r.key_points ?? [],
  agenda_items: r.agenda_items ?? [],
  attendees: r.attendees ?? [],
  minutes_text: r.minutes_text ?? null,
  source_type: r.source_type,
  source_note: r.source_note ?? null,
  youtube_url: r.youtube_url ?? null,
});

const dryRun = process.env.DRY_RUN === "1";

// 作り直した記録: 置き換える元の行があれば、その行を同じ id のまま書き換える
const upsertRows = [];
let replaced = 0;
for (const record of records) {
  const row = toRow(record);
  const replaces = record.replaces_source_type;
  if (!replaces || replaces === record.source_type) {
    upsertRows.push(row);
    continue;
  }
  const { data: existing, error: findError } = await supabase
    .from("committee_meetings")
    .select("id, source_type")
    .eq("committee_name", record.committee_name)
    .eq("meeting_date", record.meeting_date)
    .in("source_type", [replaces, record.source_type]);
  if (findError) {
    console.error(`lookup failed: ${findError.message}`);
    process.exit(1);
  }
  const target = existing.find((e) => e.source_type === replaces);
  const already = existing.find((e) => e.source_type === record.source_type);
  if (!target || already) {
    // 元の行が無い、または新しい出典の行がすでにある（再実行）→ 通常の upsert
    upsertRows.push(row);
    continue;
  }
  if (dryRun) {
    console.log(
      `[dry-run] replace ${record.meeting_date} ${record.committee_name}: ${replaces} → ${record.source_type} (id ${target.id})`
    );
    replaced += 1;
    continue;
  }
  const { error: updateError } = await supabase
    .from("committee_meetings")
    .update(row)
    .eq("id", target.id);
  if (updateError) {
    console.error(
      `replace failed (${record.meeting_date} ${record.committee_name}): ${updateError.message}`
    );
    process.exit(1);
  }
  replaced += 1;
}

if (dryRun) {
  console.log(
    `[dry-run] replace ${replaced} rows, upsert ${upsertRows.length} rows`
  );
  process.exit(0);
}

let upserted = 0;
if (upsertRows.length > 0) {
  const { data, error } = await supabase
    .from("committee_meetings")
    .upsert(upsertRows, {
      onConflict: "committee_name,meeting_date,source_type",
    })
    .select("id, committee_name, meeting_date");

  if (error) {
    console.error(`upsert failed: ${error.message}`);
    process.exit(1);
  }
  upserted = data.length;
}

console.log(`replaced ${replaced} rows, upserted ${upserted} rows`);
