import { formatJapaneseEraDate } from "@/lib/utils/japanese-era";
import type { BillWithContent } from "../types";
import { getBillDateLabel } from "./bill-status";

/** Googleのスニペットで切り詰められにくいdescriptionの目安文字数 */
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * 文字列を指定文字数以内に切り詰める（超過時は末尾に「…」を付与）。
 * 絵文字等のサロゲートペアを分断しないようコードポイント単位で数える
 */
export function truncateForSnippet(
  text: string,
  maxLength: number = MAX_DESCRIPTION_LENGTH
): string {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return `${chars.slice(0, maxLength - 1).join("")}…`;
}

/** 題名の組み立てに必要な最小の項目（議案の一覧用の軽量版でも使えるようにする） */
type BillTitleSource = {
  name: string;
  bill_content?: { title?: string | null } | null;
};

/**
 * 議案詳細ページのtitle。
 * 検索クエリ（制度名・話題）に一致しやすいAI生成のやさしい見出しを優先し、
 * 未整備の議案は正式議案名にフォールバックする。
 * h1（bill-detail-header）・OGタイトル・Article headlineと同一の解決順にする
 */
export function buildBillPageTitle(bill: BillTitleSource): string {
  return bill.bill_content?.title || bill.name;
}

/**
 * 議案名の先頭の議案番号（「議案第1号」「議員提出議案第65号」「認定第1号」など）を取り出す。
 * 名前の先頭に番号が無い議案は null
 */
export function extractBillNumber(name: string): string | null {
  return name.match(/^(\S*?第[0-9０-９]+号)(?=\s|$)/)?.[1] ?? null;
}

/**
 * 題名（buildBillPageTitle）が 2 件以上の議案で同じになっている題名の集合。
 * 「令和3年度田川市一般会計補正予算」のように、別の会期にも同じ名前の議案が出るため、
 * 検索結果で同じ題名のページが並んでしまう議案を見つけるのに使う
 */
export function findDuplicateBillTitles(
  bills: readonly BillTitleSource[]
): Set<string> {
  const counts = new Map<string, number>();
  for (const bill of bills) {
    const title = buildBillPageTitle(bill);
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }
  return new Set(
    [...counts].filter(([, count]) => count > 1).map(([title]) => title)
  );
}

/**
 * 議案詳細ページの検索結果・共有用の題名（<title> と og:title）。
 * 同じ題名の議案が他にもあるときだけ、議案番号と日付（和暦）を括弧で添えて区別する
 * （例: 令和3年度田川市一般会計補正予算（議案第1号・令和3年3月19日議決））。
 * 題名が他と重ならない議案は、従来どおり題名だけ。
 * 日付の呼び方（議決・提出・継続審議）は、議案詳細の見出しと同じ getBillDateLabel
 */
export function buildBillSearchTitle(
  bill: BillTitleSource &
    Pick<BillWithContent, "status"> & { submitted_date: string | null },
  duplicateTitles: ReadonlySet<string>
): string {
  const title = buildBillPageTitle(bill);
  if (!duplicateTitles.has(title)) return title;

  const date = bill.submitted_date
    ? formatJapaneseEraDate(bill.submitted_date)
    : null;
  const hints = [
    extractBillNumber(bill.name),
    date ? `${date}${getBillDateLabel(bill.status)}` : null,
  ].filter((hint): hint is string => hint !== null);

  return hints.length > 0 ? `${title}（${hints.join("・")}）` : title;
}

/**
 * 議案詳細ページのmeta description。
 * 「議案第◯号」等の正式名での検索にも一致するよう正式議案名を先頭に置き、
 * 続けて要約をスニペット向けの長さに切り詰めて併記する
 */
export function buildBillMetaDescription(bill: BillWithContent): string {
  const summary = bill.bill_content?.summary;
  const prefix = `田川市議会に提出された「${bill.name}」の解説。`;
  if (!summary) {
    return `${prefix}提出日・審議状況・議決結果をやさしくまとめています。`;
  }
  const remaining = MAX_DESCRIPTION_LENGTH - Array.from(prefix).length;
  return `${prefix}${truncateForSnippet(summary, remaining)}`;
}
