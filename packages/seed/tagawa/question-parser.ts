/**
 * 田川市議会「〇月定例会一般質問一覧」ページのパーサー【田川市専用】
 *
 * ページには日ごとの表（順番 / 質問者 / 質問事項）が並び、表の手前に
 * 「1日目：9月9日（水曜日）10時から」のような見出しが付く。古いページ
 * （平成29〜30年）では日付の行が表の中に入っている。会派名が付く質問者は
 * 代表質問。質問事項は「１　〇〇について」の箇条書き。
 * 純粋関数のみ。テストは question-parser.test.ts
 */

import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";
import {
  decodeHtmlEntities,
  extractMainSection,
  normalizeSpaces,
  parseSessionTitle,
  type SessionTitleInfo,
  splitByTables,
  type TableRow,
  toHalfWidthAlnum,
} from "./council-html-utils";
import { normalizePersonName } from "./council-names";
import { normalizeDigits } from "./http-utils";
import { parsePageTitle } from "./petition-parser";

/** 公式ページから読み取れる分（PDF由来の要旨・形式と動画は後段で付ける） */
export type ScrapedQuestion = Omit<
  GeneralQuestionRecord,
  "format" | "outline" | "videoUrl"
>;

export interface ParsedQuestionPage {
  session: SessionTitleInfo;
  /** 「（延期分）」ページ（同じ会期の続き） */
  deferred: boolean;
  pdfUrl: string | null;
  records: ScrapedQuestion[];
}

interface DayCursor {
  year: number;
  date: string | null;
  dayIndex: number | null;
  /** 「N日目」の記載が無いページで日付が切り替わった回数 */
  seenDays: number;
}

const DAY_HEADING = /(\d+)\s*日目\s*[：:]?\s*(\d+)\s*月\s*(\d+)\s*日/g;
/** 「3月9日（月曜日）10時～」のように開始時刻を伴う日付（延期分ページ） */
const DATED_START = /(\d+)\s*月\s*(\d+)\s*日\s*[（(][^）)]*曜日[）)]\s*(?:\d+時|から|～|〜)/;
/** 表の中の日付行（平成29〜30年の表記: 「1日目」「3月2日（木曜日）」が別セル） */
const TABLE_DATE = /(\d+)\s*月\s*(\d+)\s*日\s*[（(][^）)]*曜日[）)]/;

function toIso(year: number, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** テキスト中の日付見出しをカーソルに反映する（複数あれば最後のもの） */
function applyTextMarkers(text: string, cursor: DayCursor): void {
  const normalized = normalizeDigits(text);
  const headings = Array.from(normalized.matchAll(DAY_HEADING));
  if (headings.length > 0) {
    const last = headings[headings.length - 1];
    cursor.dayIndex = Number(last[1]);
    cursor.date = toIso(cursor.year, last[2], last[3]);
    cursor.seenDays = Math.max(cursor.seenDays, cursor.dayIndex);
    return;
  }
  const start = normalized.match(DATED_START);
  if (start) {
    cursor.seenDays += 1;
    cursor.dayIndex = cursor.seenDays;
    cursor.date = toIso(cursor.year, start[1], start[2]);
  }
}

/** 表の中の日付行（順番セルが数字でない行）をカーソルに反映する */
function applyRowMarker(row: TableRow, cursor: DayCursor): void {
  const text = normalizeDigits(row.map((cell) => cell.text).join("\n"));
  const dayMatch = text.match(/(\d+)\s*日目/);
  const dateMatch = text.match(TABLE_DATE);
  if (!dayMatch && !dateMatch) return;
  if (dayMatch) {
    cursor.dayIndex = Number(dayMatch[1]);
    cursor.seenDays = Math.max(cursor.seenDays, cursor.dayIndex);
  } else {
    cursor.seenDays += 1;
    cursor.dayIndex = cursor.seenDays;
  }
  if (dateMatch) cursor.date = toIso(cursor.year, dateMatch[1], dateMatch[2]);
}

function isOrderCell(text: string): boolean {
  return /^\d+$/.test(normalizeDigits(text).replace(/\s/g, ""));
}

/** 質問者セル「山野　義人\n（公明党）」→ 氏名と会派 */
export function parseQuestioner(cellText: string): {
  name: string;
  familyName: string;
  faction: string | null;
} {
  const joined = cellText.replace(/\n/g, "");
  const factionMatch = joined.match(/[（(]([^）)]+)[）)]/);
  const faction = factionMatch ? normalizeSpaces(factionMatch[1]) || null : null;
  const person = normalizePersonName(joined.replace(/[（(][^）)]*[）)]/g, ""));
  return { name: person.name, familyName: person.familyName, faction };
}

/**
 * 質問事項セル「１　〇〇について\n２　△△について」→ 項目の配列。
 * 番号で始まらない行（「80周年について」のように数字で始まる折り返しも含む）は
 * 前の項目に連結する。番号だけの行は次の行を本文とみなす
 */
export function parseQuestionItems(cellText: string): string[] {
  const items: string[] = [];
  for (const rawLine of cellText.split("\n")) {
    const line = normalizeSpaces(rawLine);
    if (!line) continue;
    const numbered = line.match(/^[0-9０-９]+(?:[\s\u3000.．、]+(.*))?$/);
    if (numbered?.[1]) {
      items.push(numbered[1]);
    } else if (numbered) {
      // 番号だけの行（次の行に本文）
      items.push("");
    } else if (items.length > 0) {
      items[items.length - 1] += line;
    } else {
      items.push(line);
    }
  }
  return items
    .map((item) => toHalfWidthAlnum(item.replace(/\s+/g, "")))
    .filter((item) => item.length > 0);
}

function findPdfUrl(mainHtml: string, sourceUrl: string): string | null {
  const m = mainHtml.match(/href="([^"]+\.pdf)"/i);
  return m ? new URL(decodeHtmlEntities(m[1]), sourceUrl).toString() : null;
}

/** 一般質問一覧ページ1枚を読み取る。定例会のタイトルでなければ null */
export function parseQuestionPage(
  html: string,
  sourceUrl: string
): ParsedQuestionPage | null {
  const title = parsePageTitle(html);
  const session = parseSessionTitle(title);
  if (!session) return null;
  const main = extractMainSection(html);
  const pdfUrl = findPdfUrl(main, sourceUrl);
  const cursor: DayCursor = { year: session.year, date: null, dayIndex: null, seenDays: 0 };
  const records: ScrapedQuestion[] = [];

  for (const segment of splitByTables(main)) {
    if (segment.kind === "text") {
      applyTextMarkers(segment.text, cursor);
      continue;
    }
    for (const row of segment.rows) {
      if (row.length < 3 || !isOrderCell(row[0].text)) {
        applyRowMarker(row, cursor);
        continue;
      }
      const order = Number(normalizeDigits(row[0].text).replace(/\s/g, ""));
      const questioner = parseQuestioner(row[1].text);
      records.push({
        id: `${session.key}-${order}`,
        sessionKey: session.key,
        sessionName: session.name,
        questionDate: cursor.date,
        dayIndex: cursor.dayIndex,
        order,
        memberName: questioner.name,
        familyName: questioner.familyName,
        faction: questioner.faction,
        isRepresentative: questioner.faction !== null,
        items: parseQuestionItems(row[2].text),
        sourceUrl,
        pdfUrl,
      });
    }
  }

  return { session, deferred: /延期分/.test(title), pdfUrl, records };
}

/**
 * 同じ会期のページ（本体＋延期分）をまとめ、順番で並べる。
 * 延期分ページに載っている順番は本体ページにも載っていることがあるため、
 * 同じ順番は延期分（実際に行われた日付を持つ）を優先する。
 * PDFは本体ページのものを優先する
 */
export function mergeQuestionPages(pages: readonly ParsedQuestionPage[]): {
  session: SessionTitleInfo;
  pdfUrl: string | null;
  records: ScrapedQuestion[];
} {
  if (pages.length === 0) throw new Error("統合するページがありません");
  const main = pages.find((page) => !page.deferred) ?? pages[0];
  const pdfUrl = main.pdfUrl ?? pages.find((page) => page.pdfUrl)?.pdfUrl ?? null;
  const byOrder = new Map<number, ScrapedQuestion>();
  for (const page of [...pages].sort((a, b) => Number(a.deferred) - Number(b.deferred))) {
    for (const record of page.records) {
      byOrder.set(record.order, { ...record, pdfUrl: record.pdfUrl ?? pdfUrl });
    }
  }
  const records = [...byOrder.values()].sort((a, b) => a.order - b.order);
  return { session: main.session, pdfUrl, records };
}
