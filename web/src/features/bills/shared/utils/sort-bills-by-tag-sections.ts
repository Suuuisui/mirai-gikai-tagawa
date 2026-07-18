/**
 * トップページの「タグ別議案一覧」のセクション順を動的に並べ替える純粋関数群。
 *
 * 従来はタグの `featured_priority` の固定順でセクションが並んでいたが、
 * それだと不信任決議ラッシュのような「今」政治的に熱いトピックがあっても
 * セクションの順番が変わらない。そこで各セクションの「代表スコア」
 * （セクション内の表示議案の中で最も興味度スコアが高い議案のスコア）を求め、
 * 代表スコアの降順でセクションを並べ替える。同点の場合は featured_priority の
 * 昇順（従来の固定順）にフォールバックし、順序が安定するようにする。
 */

/** 並べ替え対象のセクションが最低限持つべき形 */
export type TagSectionForSort<TBill = unknown> = {
  tag: { priority: number };
  bills: TBill[];
};

/**
 * セクション内の表示議案から代表スコア（最大値）を求め、代表スコアの降順→
 * featured_priority の昇順でセクションを並べ替える。
 * スコア計算そのものはこの関数の関心事ではないため、`getBillScore` として
 * 呼び出し元から注入する（テストでは単純なダミー関数を渡せばよい）。
 * 議案を持たないセクション（本来ローダー側でフィルタ済みだが念のため）は
 * 代表スコアを負の無限大として扱い、常に末尾に回す。
 *
 * `TSection` 単一の型パラメータのみを `sections` 引数から推論させることで、
 * `TBill` を独立した型パラメータにした場合に発生するTypeScriptの推論失敗
 * （`getBillScore` 側からは逆方向の推論になり `unknown` に落ちてしまう）を避ける。
 */
export function sortBillsByTagSections<TSection extends TagSectionForSort>(
  sections: TSection[],
  getBillScore: (bill: TSection["bills"][number]) => number
): TSection[] {
  return [...sections]
    .map((section) => ({
      section,
      representativeScore:
        section.bills.length > 0
          ? Math.max(...section.bills.map(getBillScore))
          : Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.representativeScore !== b.representativeScore) {
        return b.representativeScore - a.representativeScore;
      }
      return a.section.tag.priority - b.section.tag.priority;
    })
    .map(({ section }) => section);
}
