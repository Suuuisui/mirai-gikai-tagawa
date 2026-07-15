import type { Bill, BillContent, BillTag } from "../types";

type BillsTagRow = {
  bills:
    | (Bill & {
        bill_contents?: BillContent[] | BillContent | null;
        bills_tags?: Array<{ tags: BillTag | null }> | null;
      })
    | null;
};

/**
 * `bills_tags` を起点にした select は PostgREST の仕様上、
 * `.order(column, { referencedTable })` を付けても参照先テーブルの列で
 * 最上位の行順は並ばない（ネストした1件のみの関連には効果がない）。
 * そのためDB側のソートに頼らず、取得後にこの関数で `submitted_date` の
 * 降順（新しい順、null は末尾）に並べ替える。
 */
export function sortBillsTagRowsByDateDesc<
  T extends { bills: { submitted_date: string | null } | null },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const dateA = a.bills?.submitted_date ?? null;
    const dateB = b.bills?.submitted_date ?? null;
    if (dateA === dateB) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
    return dateA < dateB ? 1 : -1;
  });
}

/**
 * `bills_tags` 経由で取得した入れ子構造（bills.bill_contents / bills.bills_tags）を
 * フラットな `{ ...bill, bill_content, tags }` の形に整形する純粋関数。
 * `findPublishedBillsByTag()` の戻り値を画面表示用（BillWithContent相当）に変換する際に使う。
 */
export function mapBillsTagRowsToBills(rows: BillsTagRow[]) {
  return rows
    .map((item) => {
      const billData = item.bills;
      if (!billData) return null;

      const { bill_contents, bills_tags, ...bill } = billData;
      const billContent = Array.isArray(bill_contents)
        ? bill_contents[0]
        : (bill_contents ?? undefined);

      const tags = Array.isArray(bills_tags)
        ? bills_tags
            .map((bt) => bt.tags)
            .filter((t): t is BillTag => t !== null)
        : [];

      return {
        ...bill,
        bill_content: billContent,
        tags,
      };
    })
    .filter(
      (
        bill
      ): bill is Bill & {
        bill_content: BillContent | undefined;
        tags: BillTag[];
      } => bill !== null
    );
}
