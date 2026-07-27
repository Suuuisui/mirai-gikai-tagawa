import {
  type BillForInterestScore,
  sortBillsTagRowsByInterestDesc,
} from "./interest-score";

/**
 * トップページのタグ別セクションに出す議案を選定する。
 * 「注目の議案を除外 → ピン留め（pinned_priority昇順）を先頭に →
 * 残りを興味度スコア順（直近優先）に並べ替え → 上位N件」
 * という選定ポリシーを1か所に集約し、webのトップページ本体と
 * adminのトップページ編集画面のプレビューが確実に同じ結果になるようにする。
 *
 * ピン留めされた議案が「注目の議案」に入っている場合は、重複表示を
 * 避けるためタグ枠からは除外される（自動選定の議案と同じ扱い）。
 *
 * @param rows bills_tags起点のネスト構造（{bills: 議案} を持つ行。
 *   pinned_priorityが設定された行はピン留めとして先頭に並ぶ）
 * @param excludeBillIds 除外する議案ID（「注目の議案」セクションと重複させないため）
 * @param limit 上限件数（省略時は全件）
 */
export function selectTagSectionBills<
  T extends {
    bills: (BillForInterestScore & { id: string }) | null;
    pinned_priority?: number | null;
  },
>(rows: T[], excludeBillIds: ReadonlySet<string>, limit?: number): T[] {
  const filtered = rows.filter(
    (row) => row.bills !== null && !excludeBillIds.has(row.bills.id)
  );

  const pinned = filtered
    .filter((row) => row.pinned_priority != null)
    .sort(
      (a, b) =>
        (a.pinned_priority ?? Number.MAX_SAFE_INTEGER) -
        (b.pinned_priority ?? Number.MAX_SAFE_INTEGER)
    );
  const auto = sortBillsTagRowsByInterestDesc(
    filtered.filter((row) => row.pinned_priority == null)
  );

  const merged = [...pinned, ...auto];
  return limit === undefined ? merged : merged.slice(0, limit);
}
