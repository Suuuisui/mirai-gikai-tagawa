/**
 * 田川市議会「一般質問一覧」スクレイパー【田川市専用】
 *
 * 公式サイトの「一般質問一覧」（list00706）から定例会ごとのページを列挙し、
 * 各ページの表（順番・質問者・質問事項）を読み取る。通告書PDFがあるページは
 * PDFも取得し、pdftotext（poppler）があれば要旨を読み取って付ける。
 * 公式YouTubeチャンネルの録画は data/question-videos.json（動画ID・タイトル）
 * から日付と議員名で結び付ける。
 * 結果は web/src/features/general-questions/shared/data/general-questions-data.ts
 * に書き出す。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-questions
 *
 * data/question-videos.json の更新（yt-dlp が必要）:
 *   yt-dlp --flat-playlist --extractor-args "youtube:lang=ja" \
 *     --print "%(id)s\t%(title)s" <チャンネルURL>
 *   の出力から「一般質問」を含む行を [{ id, title }] の形で保存する
 *   （チャンネルは年度ごとに分かれるので、新年度は新チャンネルも確認する）
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";
import { collectLinkedPageUrls, extractPageId } from "./council-html-utils";
import {
  type DisclosedQuestionOutlines,
  findDisclosedOutline,
} from "./disclosed-question-outlines";
import { writeGeneratedData } from "./generated-data-writer";
import { CACHE_DIR, fetchBinaryWithCache, fetchWithCache } from "./http-utils";
import { parseQuestionOutlines, type QuestionOutline } from "./question-outline-parser";
import {
  mergeQuestionPages,
  type ParsedQuestionPage,
  parseQuestionPage,
  type ScrapedQuestion,
} from "./question-parser";
import { matchQuestionVideos, type QuestionVideo } from "./question-video-matcher";

const LIST_URL = "https://www.joho.tagawa.fukuoka.jp/list00706.html";
const OUT_PATH = "web/src/features/general-questions/shared/data/general-questions-data.ts";
const VIDEOS_PATH = path.join(import.meta.dirname, "data/question-videos.json");
const DISCLOSED_OUTLINES_PATH = path.join(
  import.meta.dirname,
  "data/disclosed-question-outlines.json"
);

function hasPdftotext(): boolean {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** PDFを取得し、pdftotext -layout のテキストを返す（テキストもキャッシュする） */
async function loadPdfLayoutText(pdfUrl: string, cacheName: string): Promise<string> {
  const pdfPath = path.join(CACHE_DIR, `${cacheName}.pdf`);
  const textPath = path.join(CACHE_DIR, `${cacheName}.txt`);
  if (existsSync(textPath)) return readFileSync(textPath, "utf-8");
  await fetchBinaryWithCache(pdfUrl, `${cacheName}.pdf`);
  execFileSync("pdftotext", ["-layout", pdfPath, textPath]);
  return readFileSync(textPath, "utf-8");
}

/** data/question-videos.json を読む（無ければ空。形が崩れていれば止める） */
function loadVideos(): QuestionVideo[] {
  if (!existsSync(VIDEOS_PATH)) return [];
  const parsed: unknown = JSON.parse(readFileSync(VIDEOS_PATH, "utf-8"));
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (v) => typeof v?.id === "string" && typeof v?.title === "string"
    )
  ) {
    throw new Error(`${VIDEOS_PATH} は [{ id, title }] の配列である必要があります`);
  }
  return parsed as QuestionVideo[];
}

/**
 * 公式ページの質問事項とPDFの要旨を突き合わせる。
 * 項目数が一致すれば公式ページの表記を項目名に使う（折り返しの無い綺麗な文字列）
 */
export function attachOutline(
  record: ScrapedQuestion,
  outline: QuestionOutline | undefined
): Pick<GeneralQuestionRecord, "format" | "outline"> {
  if (!outline || outline.items.length === 0) {
    return { format: outline?.format ?? null, outline: null };
  }
  const items =
    outline.items.length === record.items.length
      ? outline.items.map((item, index) => ({ ...item, title: record.items[index] }))
      : outline.items;
  return { format: outline.format, outline: items };
}

async function main() {
  const listHtml = await fetchWithCache(LIST_URL, "questions-list.html");
  const pageUrls = collectLinkedPageUrls(listHtml, {
    baseUrl: LIST_URL,
    textIncludes: "一般質問一覧",
  });
  console.log(`一般質問一覧ページ: ${pageUrls.length}件`);

  const pagesBySession = new Map<string, ParsedQuestionPage[]>();
  for (const url of pageUrls) {
    const html = await fetchWithCache(url, `questions-${extractPageId(url)}.html`);
    const parsed = parseQuestionPage(html, url);
    if (!parsed) {
      console.warn(`  会期を読み取れないため無視: ${url}`);
      continue;
    }
    const pages = pagesBySession.get(parsed.session.key) ?? [];
    pages.push(parsed);
    pagesBySession.set(parsed.session.key, pages);
  }

  const pdfAvailable = hasPdftotext();
  if (!pdfAvailable) {
    console.warn("pdftotext が無いため、通告書PDFの要旨は読み取りません（brew install poppler）");
  }

  const videos = loadVideos();
  const disclosed = JSON.parse(
    readFileSync(DISCLOSED_OUTLINES_PATH, "utf-8")
  ) as DisclosedQuestionOutlines;
  /** 会期ごとの記録（会期の最初の質問日で新しい順に並べるために保持） */
  const sessions: Array<{ firstDate: string; records: GeneralQuestionRecord[] }> = [];
  for (const [key, pages] of pagesBySession) {
    const merged = mergeQuestionPages(pages);
    let outlines: QuestionOutline[] = [];
    if (merged.pdfUrl && pdfAvailable) {
      try {
        const text = await loadPdfLayoutText(merged.pdfUrl, `questions-${key}`);
        outlines = parseQuestionOutlines(text);
      } catch (error) {
        console.warn(`  ${key}: PDFの読み取りに失敗 (${String(error)})`);
      }
    }
    const videoUrls = matchQuestionVideos(merged.records, videos);
    let outlineCount = 0;
    let disclosedCount = 0;
    const records = merged.records.map((record): GeneralQuestionRecord => {
      const pdfOutline = outlines.find((o) => o.order === record.order);
      // 公式サイトに通告書PDFが無い会期は、開示請求で交付を受けた通告書の要旨を使う
      const disclosedOutline = pdfOutline
        ? undefined
        : findDisclosedOutline(disclosed, key, record.memberName);
      const outline =
        pdfOutline ??
        (disclosedOutline && { order: record.order, ...disclosedOutline });
      if (pdfOutline) outlineCount += 1;
      if (disclosedOutline) disclosedCount += 1;
      return {
        ...record,
        ...attachOutline(record, outline),
        ...(disclosedOutline && { outlineSource: "disclosure" as const }),
        videoUrl: videoUrls.get(record.id) ?? null,
      };
    });
    const firstDate = records
      .map((r) => r.questionDate ?? "")
      .filter((d) => d.length > 0)
      .sort()[0] ?? "";
    sessions.push({ firstDate, records });
    console.log(
      `  ${key}: ${records.length}人（要旨 ${outlineCount}・開示 ${disclosedCount}・動画 ${videoUrls.size}）`
    );
  }

  // 会期の新しい順（会期内は順番のまま）
  const records = sessions
    .sort((a, b) => b.firstDate.localeCompare(a.firstDate))
    .flatMap((session) => session.records);

  const outPath = writeGeneratedData({
    relativePath: OUT_PATH,
    exportName: "GENERAL_QUESTIONS",
    typeName: "GeneralQuestionRecord",
    header: [
      "生成コマンド: pnpm --filter @mirai-gikai/seed tagawa:scrape-questions",
      `出典: 田川市議会「一般質問一覧」 ${LIST_URL} と各会期の通告書PDF（PDFが無い会期は情報開示請求で交付を受けた通告書）、公式YouTubeチャンネル`,
      `${records.length}件（${pagesBySession.size}会期）`,
    ],
    data: records,
  });
  console.log(`wrote ${outPath} (${records.length} records)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
