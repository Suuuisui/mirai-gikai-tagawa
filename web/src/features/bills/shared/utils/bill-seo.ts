import type { BillWithContent } from "../types";

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

/**
 * 議案詳細ページのtitle。
 * 検索クエリ（制度名・話題）に一致しやすいAI生成のやさしい見出しを優先し、
 * 未整備の議案は正式議案名にフォールバックする。
 * h1（bill-detail-header）・OGタイトル・Article headlineと同一の解決順にする
 */
export function buildBillPageTitle(bill: BillWithContent): string {
  return bill.bill_content?.title || bill.name;
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
