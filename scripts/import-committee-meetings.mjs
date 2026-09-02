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
 *     source_type("disclosure"|"youtube"), source_note, youtube_url
 *   }
 *
 * (committee_name, meeting_date, source_type) の一意制約で upsert するため
 * 再実行しても重複しない。
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

const rows = records.map((r) => ({
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
}));

const { data, error } = await supabase
  .from("committee_meetings")
  .upsert(rows, { onConflict: "committee_name,meeting_date,source_type" })
  .select("id, committee_name, meeting_date");

if (error) {
  console.error(`upsert failed: ${error.message}`);
  process.exit(1);
}

console.log(`upserted ${data.length} rows`);
