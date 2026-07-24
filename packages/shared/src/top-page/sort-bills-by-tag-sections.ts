/**
 * トップページの「タグ別議案一覧」のセクション順を並べ替える純粋関数群。
 *
 * 基本は運営がタグ管理画面で設定した featured_priority の昇順（固定順）で
 * 並べる。ただし、直近90日以内に話題性の高い議案（`isHotBill` 判定）が
 * 出たセクションだけは、運営設定より一時的に自動で上位へ昇格させる
 * （「今まさに話題」なセクションのみを対象にし、去年の否決議案のように
 * 話題性スコアだけは高いが古い議案では昇格させないため。詳細は
 * `isHotTopicBill`（interest-score.ts）を参照）。
 *
 * 並び順: 話題セクション（代表スコア降順、同点は featured_priority昇順）
 * → 非話題セクション（featured_priority昇順、スコアの大小は無視）。
 */

/** 並べ替え対象のセクションが最低限持つべき形 */
export type TagSectionForSort<TBill = unknown> = {
  tag: { priority: number };
  bills: TBill[];
};

/**
 * セクション内の表示議案から代表スコア（最大値）を求め、上記の並び順で
 * セクションを並べ替える。個々の議案のスコア計算方法はこの関数の関心事では
 * ないため、`getBillScore` として呼び出し元から注入する（テストでは単純な
 * ダミー関数を渡せばよい）。セクションが「話題」かどうかの判定も
 * `isHotBill` として呼び出し元から注入する（アプリ全体では
 * `isHotTopicBill` を使うが、この関数自体はそのポリシーに依存しない）。
 * 議案を持たないセクション（本来ローダー側でフィルタ済みだが念のため）は
 * `isHotBill` が呼ばれる対象がないため自然に非話題グループへ合流する
 * （featured_priority順の並びに合流する）。
 *
 * `TSection` 単一の型パラメータのみを `sections` 引数から推論させることで、
 * `TBill` を独立した型パラメータにした場合に発生するTypeScriptの推論失敗
 * （`getBillScore` 側からは逆方向の推論になり `unknown` に落ちてしまう）を避ける。
 */
export function sortBillsByTagSections<TSection extends TagSectionForSort>(
  sections: TSection[],
  getBillScore: (bill: TSection["bills"][number]) => number,
  isHotBill: (bill: TSection["bills"][number]) => boolean
): TSection[] {
  return [...sections]
    .map((section) => ({
      section,
      isHot: section.bills.some(isHotBill),
      representativeScore:
        section.bills.length > 0
          ? Math.max(...section.bills.map(getBillScore))
          : Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => {
      if (a.isHot !== b.isHot) {
        return a.isHot ? -1 : 1;
      }
      if (a.isHot) {
        return (
          b.representativeScore - a.representativeScore ||
          a.section.tag.priority - b.section.tag.priority
        );
      }
      return a.section.tag.priority - b.section.tag.priority;
    })
    .map(({ section }) => section);
}
