/**
 * 田川市議会 会議録検索システムの「閲覧ツリー」を読み取る部品【田川市専用】
 *
 * 会議録検索システム（kensakusystem.jp/tagawa。文字コードは Shift_JIS）の閲覧ツリー
 * See.exe は、次の順に POST でたどる。
 *   年のラベル（令和 8年）→ その年の会議（令和 8年 第4回定例会 ）→ 日ごとの会議録
 * このファイルは、そのやり取りに必要な部品（年ラベルの Shift_JIS 化、応答HTMLの
 * 読み取り、前回の一覧との突き合わせ、取り直す年の決め方）を純粋関数で持つ。
 * 実際のアクセスは scrape-minutes-index.ts。テストは minutes-index-parser.test.ts
 *
 * Shift_JIS の扱い（Node には Shift_JIS のエンコーダが無いための工夫）:
 * - 会議の値（treedepth）は、サイトが応答HTMLに書いてきたものをそのまま送り返す。
 *   応答を latin1 文字列として読めば 1文字＝1バイトなので、バイト列を壊さずに持ち回れる
 * - 年のラベルだけは自分で組み立てる。使う漢字は6つなので Shift_JIS のバイトを定数で持つ
 */

import { minutesFileNameToDate } from "@mirai-gikai/shared/council/official-minutes";
import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";
import { decodeHtmlEntities } from "./council-html-utils";
import { normalizeDigits } from "./http-utils";

/** 会議録検索システムに載っている最初の年（平成10年第1回定例会以降） */
export const FIRST_MINUTES_YEAR = 1998;

// ------------------------------------------------ HTML の下ごしらえ

/**
 * HTMLコメント（<!-- … -->）を取り除く。応答HTMLはコメントの中にも
 * 年のタブ（treedepth のリンク）を大量に抱えているので、解析の前に必ず除く
 */
export function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

// ------------------------------------------------ 年のラベルと Shift_JIS

function padEraYear(yearInEra: number): string {
  return String(yearInEra).padStart(2, " ");
}

/**
 * 西暦 → 会議録検索システムの年ラベル。数字1桁は半角スペースで桁をそろえる
 * （令和 2年・平成 9年。2桁なら令和10年）。2019年は改元の年で、システムには
 * 令和元年と平成31年の両方があるので2つ返す。対象外の年は空配列
 */
export function minutesYearLabels(year: number): string[] {
  if (!Number.isInteger(year)) return [];
  if (year >= 2020) return [`令和${padEraYear(year - 2018)}年`];
  if (year === 2019) return ["令和元年", "平成31年"];
  // 平成元年（1989年）は元年表記にする（システムに会議録はないので実際には使われない）
  if (year === 1989) return ["平成元年"];
  if (year >= 1990) return [`平成${padEraYear(year - 1988)}年`];
  return [];
}

/** 年ラベルに使う漢字の Shift_JIS（令和・平成・元年の6文字） */
const SJIS_KANJI: Readonly<Record<string, readonly [number, number]>> = {
  令: [0x97, 0xdf],
  和: [0x98, 0x61],
  平: [0x95, 0xbd],
  成: [0x90, 0xac],
  年: [0x94, 0x4e],
  元: [0x8c, 0xb3],
};

/**
 * 年ラベルを Shift_JIS のバイト列にする。漢字は上の6つ、数字と半角スペースは
 * ASCII のまま。知らない文字があれば例外（勝手に別の文字にして送らない）
 */
export function encodeYearLabelToSjisBytes(label: string): number[] {
  const bytes: number[] = [];
  for (const char of label) {
    const kanji = SJIS_KANJI[char];
    if (kanji) {
      bytes.push(...kanji);
    } else if (/^[0-9 ]$/.test(char)) {
      bytes.push(char.charCodeAt(0));
    } else {
      throw new Error(
        `Shift_JIS に変換できない文字です: "${char}"（${label}）`
      );
    }
  }
  return bytes;
}

function assertByte(byte: number): number {
  if (!Number.isInteger(byte) || byte < 0 || byte > 0xff) {
    throw new RangeError(`バイトの範囲外の値です: ${byte}`);
  }
  return byte;
}

/** バイト列を、1バイト＝1文字の文字列（latin1）にする */
export function bytesToLatin1(bytes: readonly number[]): string {
  return String.fromCharCode(...bytes.map(assertByte));
}

/** latin1 で読んだ文字列を、元のバイト列に戻す */
export function latin1ToBytes(value: string): number[] {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    if (code > 0xff) {
      throw new RangeError(`latin1 の範囲外の文字です: U+${code.toString(16)}`);
    }
    return code;
  });
}

/** 全バイトを %XX（大文字16進）にする。フォームの値として送る形 */
export function percentEncodeBytes(bytes: readonly number[]): string {
  return bytes
    .map(
      (byte) =>
        `%${assertByte(byte).toString(16).padStart(2, "0").toUpperCase()}`
    )
    .join("");
}

/** 閲覧ツリー（See.exe）への POST の本文。treedepth には Shift_JIS のバイト列を渡す */
export function buildTreeRequestBody(
  code: string,
  treedepthBytes: readonly number[]
): string {
  return `Code=${encodeURIComponent(code)}&treedepth=${percentEncodeBytes(treedepthBytes)}&page=&fileName=`;
}

// ------------------------------------------------ 応答HTMLの読み取り

/** トップページのリンクから、以降のリクエストに要るコード（Code=…）を取り出す */
export function parseSiteCode(html: string): string | null {
  return /\bCode=([a-z0-9]+)/.exec(stripHtmlComments(html))?.[1] ?? null;
}

/**
 * 年のラベルを送って返ってきた応答HTML（latin1 で読んだもの）から、その年の会議の
 * 値（treedepth）を出現順・重複なしで返す。会議の値は「年ラベル＋半角スペース＋会議名」
 * で始まる（年のタブの値は年ラベルだけなので混ざらない）。
 * 値は latin1 のまま＝Shift_JIS のバイト列そのもので、そのまま送り返せる
 */
export function parseSessionDepths(
  latin1Html: string,
  yearLabelBytesLatin1: string
): string[] {
  const prefix = `${yearLabelBytesLatin1} `;
  const depths: string[] = [];
  for (const match of stripHtmlComments(latin1Html).matchAll(
    /treedepth\.value\s*=\s*'([^']*)'/g
  )) {
    const value = match[1];
    if (value.startsWith(prefix) && !depths.includes(value)) {
      depths.push(value);
    }
  }
  return depths;
}

export interface MinutesDayLink {
  /** 会議録のファイル名（例: R080612A） */
  fileName: string;
  /** リンクの文字（例: （第1日 6月12日）） */
  label: string;
}

/** <a …>…</a>（属性, 中身）。閉じ忘れの <a> を跨いで次のリンクまで飲み込まない */
const ANCHOR_PATTERN = /<a\b([^>]*)>((?:(?!<a\b)[\s\S])*?)<\/a\s*>/gi;
/** href の値（"…" / '…' / 引用符なし） */
const HREF_PATTERN = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
/** 会議録のリンク（ResultFrame.exe?Code=…&fileName=…&startPos=0）のファイル名。&amp; 区切りも可 */
const FILE_NAME_PATTERN = /[?&;]fileName=([^&"'\s<>]+)/i;

/**
 * 会議（セッション）を開いた応答HTML（デコード済み）から、日ごとの会議録へのリンクを
 * 出現順に取り出す。<A href=…> / <a HREF=…>・改行・リンク内の画像タグに耐える。
 * 同じ形のリンクでもコメントの中のものは拾わない
 */
export function parseMinutesDays(html: string): MinutesDayLink[] {
  const days: MinutesDayLink[] = [];
  for (const anchor of stripHtmlComments(html).matchAll(ANCHOR_PATTERN)) {
    const href = HREF_PATTERN.exec(anchor[1]);
    const url = href?.[1] ?? href?.[2] ?? href?.[3];
    if (!url || !/ResultFrame\.exe\?/i.test(url)) continue;
    const fileName = FILE_NAME_PATTERN.exec(url)?.[1];
    if (!fileName) continue;
    const label = decodeHtmlEntities(anchor[2].replace(/<[^>]*>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    days.push({ fileName, label });
  }
  return days;
}

/**
 * 会議の値（令和 8年 第4回定例会 ）を表示用の会議名（令和8年 第4回定例会）にする。
 * 元号と数字の間の桁そろえの空白を詰め、前後の空白を除く
 */
export function normalizeSessionName(depth: string): string {
  return depth.trim().replace(/^(令和|平成)\s+(?=\d)/, "$1");
}

/** リンクの文字（（第1日 6月12日））から「第1日」を取り出す。読めなければ括弧と前後の空白を除いた文字 */
export function parseDayLabel(label: string): string {
  const day = /第\s*(\d+)\s*日/.exec(normalizeDigits(label));
  if (day) return `第${day[1]}日`;
  return label.replace(/^[\s（(]+/, "").replace(/[\s）)]+$/, "");
}

/**
 * 会議（セッション）のリンクを、会議録1日分ずつの記録にする。ファイル名から開催日が
 * 読めないもの（形が想定と違うもの）は記録に入れず、ファイル名を skippedFileNames に返す
 */
export function toMinutesRecords(
  sessionName: string,
  days: readonly MinutesDayLink[]
): { records: OfficialMinutesRecord[]; skippedFileNames: string[] } {
  const records: OfficialMinutesRecord[] = [];
  const skippedFileNames: string[] = [];
  for (const day of days) {
    const date = minutesFileNameToDate(day.fileName);
    if (date === null) {
      skippedFileNames.push(day.fileName);
      continue;
    }
    records.push({
      date,
      fileName: day.fileName,
      sessionName,
      dayLabel: parseDayLabel(day.label),
    });
  }
  return { records, skippedFileNames };
}

// ------------------------------------------------ 前回の一覧との突き合わせ

function compareRecords(
  a: OfficialMinutesRecord,
  b: OfficialMinutesRecord
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.fileName !== b.fileName) return a.fileName < b.fileName ? -1 : 1;
  return 0;
}

/**
 * 前回の一覧に、今回取り直した分を合わせる。取り直した年（西暦。date の先頭4桁で判定）
 * の分は今回の結果で置き換え、それ以外の年は前回のまま残す。ファイル名の重複は今回の
 * 分を優先して1件にし、開催日の昇順（同じ日はファイル名の昇順）に並べる
 */
export function mergeMinutesRecords(
  previous: readonly OfficialMinutesRecord[],
  crawled: readonly OfficialMinutesRecord[],
  crawledYears: readonly number[]
): OfficialMinutesRecord[] {
  const replacedYears = new Set(crawledYears.map((year) => String(year)));
  const byFileName = new Map<string, OfficialMinutesRecord>();
  for (const record of previous) {
    if (!replacedYears.has(record.date.slice(0, 4))) {
      byFileName.set(record.fileName, record);
    }
  }
  for (const record of crawled) {
    byFileName.set(record.fileName, record);
  }
  return [...byFileName.values()].sort(compareRecords);
}

/** next にあって previous に無い（ファイル名で判定）会議録を、開催日の昇順で返す */
export function diffMinutesRecords(
  previous: readonly OfficialMinutesRecord[],
  next: readonly OfficialMinutesRecord[]
): OfficialMinutesRecord[] {
  const known = new Set(previous.map((record) => record.fileName));
  const added = new Map<string, OfficialMinutesRecord>();
  for (const record of next) {
    if (!known.has(record.fileName) && !added.has(record.fileName)) {
      added.set(record.fileName, record);
    }
  }
  return [...added.values()].sort(compareRecords);
}

// ------------------------------------------------ 取り直す年と、置き換えてよいかの判断

/** JST（日本時間）での年。毎朝の自動更新は UTC で動くので、年またぎで日本の年に合わせる */
export function jstYear(now: Date): number {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCFullYear();
}

/**
 * コマンドライン引数から、取り直す年（西暦）を決める。
 * - 引数なし: JST の今年と前年（新しい会議録が載るのは主に今年だけ。年またぎの取りこぼし用に前年も）
 * - --all: 平成10年（1998年）から今年まで全部
 * - --years 2025,2026: 指定した年だけ
 * pnpm が渡す単独の "--" は無視する。知らない引数・年の形の誤りは例外
 */
export function resolveTargetYears(
  argv: readonly string[],
  now: Date
): number[] {
  const thisYear = jstYear(now);
  let all = false;
  let yearsValue: string | null = null;
  const args = argv.filter((arg) => arg !== "--");
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--all") {
      all = true;
    } else if (arg === "--years") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error("--years には 2025,2026 のように年を指定してください");
      }
      yearsValue = value;
      index += 1;
    } else if (arg.startsWith("--years=")) {
      yearsValue = arg.slice("--years=".length);
    } else {
      throw new Error(`知らない引数です: ${arg}（--all / --years 2025,2026）`);
    }
  }
  if (all && yearsValue !== null) {
    throw new Error("--all と --years は同時に指定できません");
  }
  if (all) {
    return Array.from(
      { length: thisYear - FIRST_MINUTES_YEAR + 1 },
      (_, offset) => FIRST_MINUTES_YEAR + offset
    );
  }
  if (yearsValue !== null) {
    const years = yearsValue.split(",").map((text) => {
      if (!/^\d{4}$/.test(text.trim())) {
        throw new Error(`年は西暦4桁で指定してください: "${text}"`);
      }
      return Number(text.trim());
    });
    return [...new Set(years)].sort((a, b) => a - b);
  }
  return [thisYear - 1, thisYear];
}

/**
 * 取り直した年の結果で前回の記録を置き換えてよいかの判断。
 * - keep-failed: リクエストが途中で失敗した（取りこぼしがあるかもしれない）→ 前回のまま
 * - keep-empty: 会議または会議録が1つも取れなかったのに前回はその年の記録があった
 *   （サイト側の不調とみなす）→ 前回のまま
 * - replace: 今回の結果で置き換える
 */
export type YearReplacement = "replace" | "keep-failed" | "keep-empty";

export function decideYearReplacement(input: {
  failed: boolean;
  sessionCount: number;
  recordCount: number;
  previousRecordCount: number;
}): YearReplacement {
  if (input.failed) return "keep-failed";
  const gotNothing = input.sessionCount === 0 || input.recordCount === 0;
  if (gotNothing && input.previousRecordCount > 0) return "keep-empty";
  return "replace";
}

// ------------------------------------------------ 保存した一覧（data/official-minutes.json）

export interface StoredMinutesIndex {
  /** 会議録検索システムが田川市議会に割り当てているコード */
  code: string;
  records: OfficialMinutesRecord[];
}

function isOfficialMinutesRecord(
  value: unknown
): value is OfficialMinutesRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
    typeof record.fileName === "string" &&
    record.fileName.length > 0 &&
    typeof record.sessionName === "string" &&
    typeof record.dayLabel === "string"
  );
}

/**
 * 保存した一覧（JSON の文字列）を読む。形が崩れていれば例外にする
 * （空の一覧として扱うと、次の書き出しで他の年の記録まで消えてしまう）
 */
export function parseStoredMinutesIndex(text: string): StoredMinutesIndex {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`会議録の一覧が JSON として読めません: ${String(error)}`);
  }
  const stored = parsed as { code?: unknown; records?: unknown } | null;
  if (
    typeof stored?.code !== "string" ||
    !Array.isArray(stored.records) ||
    !stored.records.every(isOfficialMinutesRecord)
  ) {
    throw new Error(
      '会議録の一覧は { "code": 文字列, "records": [{ date, fileName, sessionName, dayLabel }] } の形である必要があります'
    );
  }
  return { code: stored.code, records: stored.records };
}
