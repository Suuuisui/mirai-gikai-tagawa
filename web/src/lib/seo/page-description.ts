/**
 * meta description の長さの目安（全角も半角も 1 字と数える）。
 * Google の検索結果の説明文は、PC で 120 字前後、スマホで 100 字前後で切れる。
 * 短すぎるとページの内容が伝わらないので、80 字以上を目安にする
 */
export const DESCRIPTION_MIN_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 120;

/** サロゲートペア（𠮷 など）を 1 字として数える */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/** 改行を取り除き、連続する空白を 1 つにする（日本語の文の途中の改行は空白にしない） */
function flatten(text: string): string {
  return text
    .replace(/\s*[\r\n]+\s*/g, "")
    .replace(/[ \t　]{2,}/g, " ")
    .trim();
}

/** 文末（。！？とそれに続く閉じかっこ） */
const SENTENCE_END = /[。！？]+[」』）)]*/g;

interface FitOptions {
  min?: number;
  max?: number;
}

/**
 * text のうち max 字以内に収まる、最後の文末の位置（先頭からの字数）。文末が無ければ 0。
 * 文末は「。！？」とその直後の閉じかっこまでをひとまとまりに数える。
 * 句点が max 字目でも、直後の閉じかっこが max 字を超えるなら、その文末は使わない
 * （閉じかっこだけを落とすと、開きかっこだけが残るため）
 */
function findLastSentenceEnd(text: string, max: number): number {
  let end = 0;
  for (const match of text.matchAll(SENTENCE_END)) {
    const matchEnd = countCharacters(
      text.slice(0, (match.index ?? 0) + match[0].length)
    );
    if (matchEnd > max) break;
    end = matchEnd;
  }
  return end;
}

/**
 * 長い文章から description にする部分を切り出す。
 * - max 字以内ならそのまま使う
 * - 超えるときは、max 字以内で最後の文末（。）までで切る。文の途中で終わらないため
 * - 文末で切ると min 字に満たないときは、max - 1 字で切って「…」を付ける
 *   （短すぎて内容が伝わらないよりよいため）
 */
export function fitDescription(
  text: string,
  {
    min = DESCRIPTION_MIN_LENGTH,
    max = DESCRIPTION_MAX_LENGTH,
  }: FitOptions = {}
): string {
  const flat = flatten(text);
  const chars = Array.from(flat);
  if (chars.length <= max) return flat;

  const sentences = chars.slice(0, findLastSentenceEnd(flat, max)).join("");
  if (countCharacters(sentences) >= min) return sentences;

  return `${chars.slice(0, max - 1).join("")}…`;
}

/**
 * prefix のあとに items を区切り文字でつなげ、suffix で閉じる。
 * 全体が max 字を超えるときは、入る分だけの items にして overflow（既定は「ほか」）を付ける。
 * overflow に関数を渡すと、入りきらなかった件数を受け取れる（例: n => `ほか${n}人`）。
 * 質問者の一覧のように、件数が増えても description が長くなりすぎない文を作る
 */
export function joinWithinLimit({
  prefix,
  items,
  separator = "・",
  suffix = "",
  overflow = "ほか",
  max = DESCRIPTION_MAX_LENGTH,
}: {
  prefix: string;
  items: readonly string[];
  separator?: string;
  suffix?: string;
  overflow?: string | ((omittedCount: number) => string);
  max?: number;
}): string {
  const all = `${prefix}${items.join(separator)}${suffix}`;
  if (countCharacters(all) <= max) return all;

  const overflowText = (omittedCount: number) =>
    typeof overflow === "function" ? overflow(omittedCount) : overflow;
  const build = (included: readonly string[]) =>
    `${prefix}${included.join(separator)}${overflowText(items.length - included.length)}${suffix}`;

  const included: string[] = [];
  for (const item of items) {
    if (countCharacters(build([...included, item])) > max) break;
    included.push(item);
  }
  if (included.length === 0) {
    return fitDescription(`${prefix}${suffix}`, { max });
  }
  return build(included);
}
