/**
 * 田川市議会「請願・陳情 審査状況と審査結果」ページのパーサー【田川市専用】
 *
 * ページには「◆請願」「◇陳情」の2つの表があり、列は
 *   請願: 番号 / 件名（請願文PDF） / 紹介議員 / 上程 / 付託委員会 / 審査状況・結果【措置】
 *   陳情: 番号 / 件名（陳情文PDF） / 上程 / 付託委員会 / 審査状況・結果【措置】
 * 年代によって日付の書式（令和5年6月19日・H27.9.4）や結果の書き方
 * （採　択・項目ごとの採択/不採択）が違うため、ここで吸収する。
 * 純粋関数のみ。テストは petition-parser.test.ts
 */

import type {
  PetitionIntroducer,
  PetitionKind,
  PetitionRecord,
  PetitionStatus,
} from "@mirai-gikai/shared/council/types";
import {
  compactSpaces,
  decodeHtmlEntities,
  extractMainSection,
  extractPageId,
  normalizeSpaces,
  parseAllWarekiDates,
  parseTables,
  parseWarekiDate,
  stripWarekiDates,
  type TableCell,
  type TableRow,
} from "./council-html-utils";
import { normalizePersonName } from "./council-names";
import { normalizeDigits } from "./http-utils";

/** 公式ページで略称のまま書かれる常任・議会運営委員会 */
const KNOWN_COMMITTEE_ABBREVIATIONS = new Set([
  "総務文教",
  "厚生",
  "建設経済",
  "議会運営",
]);

function withCommitteeSuffix(name: string): string {
  return name.endsWith("委員会") ? name : `${name}委員会`;
}

/**
 * 付託委員会セルを正式名の配列にする。
 * 「厚　生」のような字間の空白、「世界記憶/遺産事業/推進特別」のような
 * 改行分割、「陳情項目(1)」の注記を吸収する
 */
export function normalizeCommittees(cellText: string): string[] {
  const lines = cellText
    .split("\n")
    .map((line) => compactSpaces(normalizeDigits(line)))
    .filter((line) => line.length > 0 && !/^陳情項目/.test(line));
  const committees: string[] = [];
  // 「世界記憶 / 遺産事業 / 推進特別」のように1つの委員会名が複数行に
  // 分かれている場合は、既知の略称か「〜特別」「〜委員会」で終わるまで行を連結する
  let buffer = "";
  for (const line of lines) {
    buffer += line;
    if (KNOWN_COMMITTEE_ABBREVIATIONS.has(buffer) || /特別$|委員会$/.test(buffer)) {
      committees.push(withCommitteeSuffix(buffer));
      buffer = "";
    }
  }
  if (buffer) committees.push(withCommitteeSuffix(buffer));
  return Array.from(new Set(committees));
}

export interface PetitionResultInfo {
  status: PetitionStatus;
  result: string | null;
  measure: string | null;
  decidedDate: string | null;
}

const RESULT_WORDS = ["不採択", "採択", "取り下げ", "継続審査", "審議未了", "審査未了"];

function extractResultWord(text: string): string | null {
  const compact = compactSpaces(text);
  return RESULT_WORDS.find((word) => compact.includes(word)) ?? null;
}

/** 「採択（意見付き）」のように、結果語に付いた注記を残す */
function decorate(line: string, word: string): string {
  return compactSpaces(line).includes("（意見付き）") ? `${word}（意見付き）` : word;
}

/**
 * 「審査状況・結果【措置】」セルから、審査日・結果・措置・分類を読み取る。
 * 項目ごとに結果が分かれる場合（（1）採択 （2）不採択）は「項目1: 採択、項目2: 不採択」にまとめる。
 * 措置（【執行部送付】など）だけが書かれている場合は採択後の措置なので採択として扱う
 */
export function parsePetitionResult(cellText: string): PetitionResultInfo {
  const decidedDate = [...parseAllWarekiDates(cellText)].sort().at(-1) ?? null;

  const measures: string[] = [];
  const withoutMeasures = cellText.replace(/【([^】]+)】/g, (_, inner: string) => {
    measures.push(compactSpaces(inner));
    return "\n";
  });
  // 「（1）採択（2）不採択」のように1行に並ぶ項目も行に分ける
  const lines = stripWarekiDates(withoutMeasures)
    .replace(/(?<=\S)\s*([（(]\s*\d+\s*[）)])/g, "\n$1")
    .split("\n")
    .map((line) => normalizeSpaces(line).replace(/※意見/g, "（意見付き）"))
    .filter((line) => line.length > 0);

  const itemResults: Array<{ label: string; word: string }> = [];
  const plainWords: string[] = [];
  let pendingLabel: string | null = null;
  for (const line of lines) {
    const labelMatch = line.match(/^[（(]?\s*(\d+)\s*[）)]?\s*(.*)$/);
    const word = extractResultWord(line);
    if (labelMatch) {
      if (word) {
        itemResults.push({ label: labelMatch[1], word: decorate(line, word) });
        pendingLabel = null;
      } else {
        pendingLabel = labelMatch[1];
      }
      continue;
    }
    if (!word) continue;
    if (pendingLabel !== null) {
      itemResults.push({ label: pendingLabel, word: decorate(line, word) });
      pendingLabel = null;
    } else {
      plainWords.push(decorate(line, word));
    }
  }

  const words = [...itemResults.map((r) => r.word), ...plainWords];
  const measure = measures.length > 0 ? Array.from(new Set(measures)).join("・") : null;
  const result =
    itemResults.length > 0
      ? itemResults.map((r) => `項目${r.label}: ${r.word}`).join("、")
      : plainWords.length > 0
        ? Array.from(new Set(plainWords)).join("、")
        : null;
  const status = classifyPetitionStatus(words);

  return {
    status: status === "pending" && measure ? "adopted" : status,
    result,
    measure,
    decidedDate,
  };
}

/** 結果の語の並びから分類を決める */
export function classifyPetitionStatus(words: readonly string[]): PetitionStatus {
  const joined = words.join("/");
  if (joined.includes("取り下げ")) return "withdrawn";
  if (joined.includes("継続審査")) return "continued";
  if (joined.includes("審議未了") || joined.includes("審査未了")) return "expired";
  const adopted = words.some((w) => w.startsWith("採択"));
  const rejected = words.some((w) => w.startsWith("不採択"));
  if (adopted && rejected) return "partial";
  if (rejected) return "rejected";
  if (adopted) return "adopted";
  return "pending";
}

/** 件名セルから請願文・陳情文（PDF）の行を除き、折り返しを1行にする */
function parseTitle(cellText: string): string {
  return cellText
    .split("\n")
    .filter((line) => !/^(請願文|陳情文)/.test(line) && !/PDF/.test(line))
    .join("")
    .replace(/\s+/g, "");
}

function parseIntroducers(cellText: string): PetitionIntroducer[] {
  return cellText
    .split("\n")
    .map((line) => line.replace(/[（(]代表者[）)]/g, "").trim())
    .filter((line) => line.length > 0)
    .map((line) => normalizePersonName(line));
}

function isNumberCell(text: string): boolean {
  return /^\d+$/.test(compactSpaces(normalizeDigits(text)));
}

function toAbsoluteUrl(href: string, baseUrl: string): string {
  return new URL(decodeHtmlEntities(href), baseUrl).toString();
}

/** 種別ごとの列の並びに合わせてセルを名前付きで取り出す */
function pickCells(row: TableRow, kind: PetitionKind) {
  const [numberCell, titleCell, ...rest] = row;
  const introducerCell = kind === "seigan" ? rest.shift() : undefined;
  const [submittedCell, committeeCell, ...resultCells] = rest;
  return { numberCell, titleCell, introducerCell, submittedCell, committeeCell, resultCells };
}

function parseRow(
  row: TableRow,
  kind: PetitionKind,
  sourceUrl: string,
  sourceTitle: string
): PetitionRecord | null {
  const cells = pickCells(row, kind);
  if (!cells.titleCell || !cells.submittedCell || !cells.committeeCell) return null;

  const submittedDate = parseWarekiDate(cells.submittedCell.text);
  if (!submittedDate) return null;

  const number = Number(compactSpaces(normalizeDigits(cells.numberCell.text)));
  const resultInfo = parsePetitionResult(
    cells.resultCells.map((cell) => cell.text).join("\n")
  );
  const pdf = [cells.titleCell, ...cells.resultCells]
    .flatMap((cell: TableCell) => cell.links)
    .find((href) => /\.pdf$/i.test(href));

  return {
    id: `${kind}-${extractPageId(sourceUrl)}-${number}`,
    kind,
    number,
    title: parseTitle(cells.titleCell.text),
    documentUrl: pdf ? toAbsoluteUrl(pdf, sourceUrl) : null,
    introducers: cells.introducerCell ? parseIntroducers(cells.introducerCell.text) : [],
    submittedDate,
    committees: normalizeCommittees(cells.committeeCell.text),
    decidedDate: resultInfo.decidedDate,
    status: resultInfo.status,
    result: resultInfo.result,
    measure: resultInfo.measure,
    sourceUrl,
    sourceTitle,
  };
}

/** ページタイトル（<title>の「 / 福岡県田川市」より前） */
export function parsePageTitle(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? normalizeSpaces(decodeHtmlEntities(m[1]).split(" / ")[0]) : "";
}

/** 請願・陳情ページ1枚を PetitionRecord の配列にする（表の出現順） */
export function parsePetitionPage(html: string, sourceUrl: string): PetitionRecord[] {
  const sourceTitle = parsePageTitle(html);
  const records: PetitionRecord[] = [];
  for (const rows of parseTables(extractMainSection(html))) {
    if (rows.length === 0) continue;
    const headerText = rows[0].map((cell) => cell.text).join("\n");
    const kind: PetitionKind = headerText.includes("紹介議員") ? "seigan" : "chinjo";
    for (const row of rows.slice(1)) {
      if (row.length < 5 || !isNumberCell(row[0].text)) continue;
      const record = parseRow(row, kind, sourceUrl, sourceTitle);
      if (record) records.push(record);
    }
  }
  return records;
}

/** 上程日の新しい順（同日なら請願→陳情、番号の大きい順） */
export function sortPetitions(records: readonly PetitionRecord[]): PetitionRecord[] {
  const kindOrder: Record<PetitionKind, number> = { seigan: 0, chinjo: 1 };
  return [...records].sort(
    (a, b) =>
      b.submittedDate.localeCompare(a.submittedDate) ||
      kindOrder[a.kind] - kindOrder[b.kind] ||
      b.number - a.number
  );
}
