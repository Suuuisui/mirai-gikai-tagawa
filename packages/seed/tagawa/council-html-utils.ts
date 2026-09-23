/**
 * 田川市公式サイトの「表」で構成されたページ（請願・陳情、一般質問一覧）を
 * 読み取るための共通ユーティリティ【田川市専用】
 *
 * 外部依存を持たない純粋関数のみ。テストは council-html-utils.test.ts
 */

import { normalizeDigits } from "./http-utils";

export interface TableCell {
  /** セル内テキスト（改行で区切られた行を \n で連結） */
  text: string;
  /** セル内のリンク先URL（PDF等） */
  links: string[];
}

export type TableRow = TableCell[];

export type PageSegment =
  | { kind: "text"; text: string }
  | { kind: "table"; rows: TableRow[] };

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** 名前付き・数値参照の両方をデコードする */
export function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, body: string) => {
      if (body.startsWith("#x") || body.startsWith("#X")) {
        return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
      }
      if (body.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    }
  );
}

/** 公式ページの本文部分（検索窓の後ろ〜問い合わせ欄の前）だけを取り出す */
export function extractMainSection(html: string): string {
  const withoutScripts = html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  const start = withoutScripts.indexOf("何をお探しですか");
  const body = start === -1 ? withoutScripts : withoutScripts.slice(start);
  const end = body.indexOf("このページに関する");
  return end === -1 ? body : body.slice(0, end);
}

/** 全角空白・NBSP・タブを半角空白に寄せ、連続する空白を1つにまとめる */
export function normalizeSpaces(text: string): string {
  return text
    .replace(/[\u3000\u00a0\t]/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** 空白（全角・NBSP含む）をすべて取り除く */
export function compactSpaces(text: string): string {
  return text.replace(/[\s\u3000\u00a0]+/g, "");
}

/** 全角英数字を半角にする（記号・かなはそのまま） */
export function toHalfWidthAlnum(text: string): string {
  return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

/**
 * HTML断片を行の配列にする。br・段落・リスト・表の行を改行とみなし、
 * タグを除去して実体参照をデコードし、空行は捨てる
 */
export function htmlToLines(fragment: string): string[] {
  const withBreaks = fragment
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(withBreaks)
    .split("\n")
    .map((line) => normalizeSpaces(line))
    .filter((line) => line.length > 0);
}

function parseCell(fragment: string): TableCell {
  const links = Array.from(
    fragment.matchAll(/href="([^"]+)"/gi),
    (m) => m[1]
  );
  return { text: htmlToLines(fragment).join("\n"), links };
}

function parseRows(tableInner: string): TableRow[] {
  const rows: TableRow[] = [];
  for (const rowMatch of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(
      rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
      (m) => parseCell(m[1])
    );
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

/** 本文中の表を、出現順に行×セルの配列として返す */
export function parseTables(html: string): TableRow[][] {
  return splitByTables(html).flatMap((segment) =>
    segment.kind === "table" ? [segment.rows] : []
  );
}

/**
 * 本文を「表」と「表の間のテキスト」に分けて出現順に返す。
 * 一般質問一覧のように、表の手前の見出し（1日目：9月9日…）が
 * 表の内容に効いてくるページで使う。
 * 表の入れ子（table の中の table）は想定していない（対象ページに無い）
 */
export function splitByTables(html: string): PageSegment[] {
  const segments: PageSegment[] = [];
  let cursor = 0;
  for (const m of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const before = html.slice(cursor, m.index);
    if (before.trim()) {
      segments.push({ kind: "text", text: htmlToLines(before).join("\n") });
    }
    segments.push({ kind: "table", rows: parseRows(m[1]) });
    cursor = m.index + m[0].length;
  }
  const rest = html.slice(cursor);
  if (rest.trim()) {
    segments.push({ kind: "text", text: htmlToLines(rest).join("\n") });
  }
  return segments;
}

const ERA_BASE_YEAR: Record<string, number> = {
  令和: 2018,
  R: 2018,
  平成: 1988,
  H: 1988,
};

/** 和暦の日付（「令和5年6月19日」「令和元年\n6月24日」「H27.9.4」）。matchAll 用に g 付き */
const WAREKI_DATE_PATTERNS = [
  /(令和|平成)\s*(元|\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/g,
  /([HR])\s*(\d+)\.(\d+)\.(\d+)/g,
];

function toIsoDate(era: string, year: string, month: string, day: string) {
  const y = year === "元" ? 1 : Number(year);
  const base = ERA_BASE_YEAR[era];
  return `${base + y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * 和暦の日付をすべて YYYY-MM-DD で返す（出現順）。
 * 「令和5年6月19日」「令和5年\n6月19日」「令和元年6月24日」「H27.9.4」に対応
 */
export function parseAllWarekiDates(text: string): string[] {
  const normalized = normalizeDigits(text);
  const dates: Array<{ index: number; date: string }> = [];
  for (const pattern of WAREKI_DATE_PATTERNS) {
    for (const m of normalized.matchAll(pattern)) {
      dates.push({ index: m.index, date: toIsoDate(m[1], m[2], m[3], m[4]) });
    }
  }
  return dates.sort((a, b) => a.index - b.index).map((d) => d.date);
}

/** 最初に出てくる和暦の日付を YYYY-MM-DD で返す */
export function parseWarekiDate(text: string): string | null {
  return parseAllWarekiDates(text)[0] ?? null;
}

/** 和暦の日付を改行に置き換えたテキストを返す（日付以外の語を取り出すとき用） */
export function stripWarekiDates(text: string): string {
  let result = normalizeDigits(text);
  for (const pattern of WAREKI_DATE_PATTERNS) {
    result = result.replace(pattern, "\n");
  }
  return result;
}

export interface SessionTitleInfo {
  /** diet_sessions.slug と同じ形式（例: r8-6-teirei） */
  key: string;
  /** diet_sessions.name と同じ形式（例: 令和8年（第6回）9月定例会） */
  name: string;
  /** 西暦 */
  year: number;
}

/**
 * 「令和8年（第6回）田川市議会9月定例会一般質問一覧」のようなページタイトルから
 * 会期キー・会期名・西暦を取り出す。定例会以外（臨時会）は対象外
 */
export function parseSessionTitle(title: string): SessionTitleInfo | null {
  const m = normalizeDigits(title).match(
    /(令和|平成)\s*(元|\d+)\s*年\s*[（(]\s*第\s*(\d+)\s*回\s*[）)]\s*田川市議会\s*(\d+)\s*月\s*定例会/
  );
  if (!m) return null;
  const era = m[1];
  const yearInEra = m[2] === "元" ? 1 : Number(m[2]);
  const round = Number(m[3]);
  const month = Number(m[4]);
  const eraLabel = era === "令和" && yearInEra === 1 ? "元" : String(yearInEra);
  return {
    key: `${era === "令和" ? "r" : "h"}${yearInEra}-${round}-teirei`,
    name: `${era}${eraLabel}年（第${round}回）${month}月定例会`,
    year: ERA_BASE_YEAR[era] + yearInEra,
  };
}

/** URLから公式ページID（kiji0038564 など）を取り出す */
export function extractPageId(url: string): string {
  const m = url.match(/(kiji\d+)/);
  if (!m) throw new Error(`ページIDが読み取れません: ${url}`);
  return m[1];
}

/**
 * 一覧ページの本文から、リンク文字列に `textIncludes` を含む記事ページのURLを
 * 出現順・重複なしで集める（「請願・陳情」「一般質問一覧」の一覧ページ共通）
 */
export function collectLinkedPageUrls(
  listHtml: string,
  options: { baseUrl: string; textIncludes: string }
): string[] {
  const urls = new Set<string>();
  for (const m of extractMainSection(listHtml).matchAll(
    /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  )) {
    const text = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ""));
    if (text.includes(options.textIncludes) && m[1].includes("/kiji")) {
      urls.add(new URL(decodeHtmlEntities(m[1]), options.baseUrl).toString());
    }
  }
  return [...urls];
}
