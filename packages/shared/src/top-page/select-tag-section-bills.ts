import {
  type BillForInterestScore,
  sortBillsTagRowsByInterestDesc,
} from "./interest-score";

/**
 * トップページのタグ別セクションに出す議案を選定する。
 * 「注目の議案を除外 → 興味度スコア順（直近優先）に並べ替え → 上位N件」
 * という選定ポリシーを1か所に集約し、webのトップページ本体と
 * adminのトップページ編集画面のプレビューが確実に同じ結果になるようにする。
 *
 * @param rows bills_tags起点のネスト構造（{bills: 議案} を持つ行）
 * @param excludeBillIds 除外する議案ID（「注目の議案」セクションと重複させないため）
 * @param limit 上限件数（省略時は全件）
 */
export function selectTagSectionBills<
  T extends { bills: (BillForInterestScore & { id: string }) | null },
>(rows: T[], excludeBillIds: ReadonlySet<string>, limit?: number): T[] {
  const filtered = rows.filter(
    (row) => row.bills !== null && !excludeBillIds.has(row.bills.id)
  );
  const sorted = sortBillsTagRowsByInterestDesc(filtered);
  return limit === undefined ? sorted : sorted.slice(0, limit);
}
