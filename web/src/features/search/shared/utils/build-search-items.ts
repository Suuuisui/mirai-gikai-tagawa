import type { BillWithContent } from "@/features/bills/shared/types";
import type { SearchItem } from "../types";

/** 検索結果カードに表示するsummaryの最大文字数 */
const SUMMARY_MAX_LENGTH = 120;

function truncateSummary(summary?: string | null): string {
  if (!summary) return "";
  return summary.length > SUMMARY_MAX_LENGTH
    ? `${summary.slice(0, SUMMARY_MAX_LENGTH)}…`
    : summary;
}

/**
 * 議案データ（本文含む）から検索ページ用の軽量データを作る
 * contentは含めないため、ページに渡すデータ量を抑えられる
 */
export function buildSearchItems(bills: BillWithContent[]): SearchItem[] {
  return bills.map((bill) => ({
    id: bill.id,
    title: bill.bill_content?.title || bill.name,
    name: bill.name,
    summary: truncateSummary(bill.bill_content?.summary),
    submittedDate: bill.submitted_date,
    status: bill.status,
    tags: bill.tags.map((tag) => tag.label),
  }));
}
