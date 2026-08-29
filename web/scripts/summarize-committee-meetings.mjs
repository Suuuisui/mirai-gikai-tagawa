/**
 * 委員会会議録の中間JSONに対して、AI Gateway経由で
 * summary / key_points / agenda_items / attendees を生成して埋める。
 *
 * 使い方:
 *   cd web && npx dotenv-cli -e ../.env -- \
 *     node scripts/summarize-committee-meetings.mjs <in.json> <out.json>
 *
 * summaryが既に入っているレコードはスキップするため再実行可能。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { generateObject } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-4o-mini";
// 長時間会議でも自動字幕テキストはこの範囲に収まる。安全のための上限
const MAX_INPUT_CHARS = 120_000;

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error(
    "usage: node scripts/summarize-committee-meetings.mjs <in.json> <out.json>"
  );
  process.exit(1);
}

const schema = z.object({
  summary: z
    .string()
    .describe(
      "この会議の内容の300字程度の要約。市民向けにやさしい言葉で、ですます調。固有名詞・金額・結論を含める"
    ),
  key_points: z
    .array(z.string())
    .min(3)
    .max(10)
    .describe("議論の要点。事実ベースの箇条書き（1項目80字以内）"),
  agenda_items: z.array(z.string()).describe("議題の一覧（読み取れる範囲で）"),
  attendees: z
    .array(z.string())
    .describe(
      "発言・紹介から特定できる出席者の氏名（役職は含めず姓名のみ。確実に読み取れるもののみ）"
    ),
});

const records = JSON.parse(readFileSync(inFile, "utf8"));
let done = 0;
let failed = 0;

for (const [i, rec] of records.entries()) {
  if (rec.summary || !rec.minutes_text) continue;
  const text = rec.minutes_text.slice(0, MAX_INPUT_CHARS);
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema,
      prompt: [
        `以下は田川市議会「${rec.committee_name}」（${rec.meeting_date}開催）の`,
        rec.source_type === "youtube"
          ? "公式中継の自動字幕テキストです。音声認識の誤変換が含まれる点を考慮し、"
          : "議事録テキストです。",
        "内容を分析して指定の形式で出力してください。",
        "誤変換と思われる固有名詞は文脈から推測して自然な表記に直してください。",
        "推測できない事実は書かないでください。",
        "",
        "---",
        text,
      ].join("\n"),
    });
    rec.summary = object.summary;
    rec.key_points = object.key_points;
    rec.agenda_items = object.agenda_items;
    rec.attendees = object.attendees;
    done++;
    console.log(`[${i + 1}/${records.length}] ${rec.title} OK`);
  } catch (err) {
    failed++;
    console.error(`[${i + 1}/${records.length}] ${rec.title} FAILED: ${err.message}`);
  }
  // 途中経過を毎回保存（中断しても再実行で続きから）
  writeFileSync(outFile, JSON.stringify(records, null, 1));
}

console.log(`done=${done} failed=${failed} -> ${outFile}`);
