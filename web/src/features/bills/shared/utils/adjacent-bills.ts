/**
 * 議案一覧（表示順に並んだ配列）の中から、指定した議案の前後の議案を求める
 * 純粋関数。会期まとめページ（/sessions/[id]）の「全議案リスト」と同じ
 * 並び順（status_order昇順→submitted_date降順）を議案詳細ページの
 * 前後ナビゲーションでも使うため、ソートは行わず呼び出し側が渡した順序を
 * そのまま採用する（呼び出し側が表示順を保証すること）。
 * currentId が bills に存在しない場合は previous/next とも null を返す。
 */
export function findAdjacentBills<T extends { id: string }>(
  bills: T[],
  currentId: string
): { previous: T | null; next: T | null } {
  const index = bills.findIndex((bill) => bill.id === currentId);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? bills[index - 1] : null,
    next: index < bills.length - 1 ? bills[index + 1] : null,
  };
}
