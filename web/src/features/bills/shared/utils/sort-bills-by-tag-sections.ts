import { MIN_NOTABLE_SCORE } from "./interest-score";

/**
 * トップページの「タグ別議案一覧」のセクション順を並べ替える純粋関数群。
 *
 * 基本は運営がタグ管理画面で設定した featured_priority の昇順（固定順）で
 * 並べる。ただし、不信任決議ラッシュのような「今」政治的に熱いトピックが
 * あるセクションは、運営設定より自動的に上位へ昇格させる。「熱いトピック」
 * の判定は各セクションの「代表スコア」（セクション内の表示議案の中で最も
 * 興味度スコアが高い議案のスコア）が MIN_NOTABLE_SCORE を超えるかどうかで
 * 行う（pickSessionHighlights の「ハイライト」表示要否と同じ閾値・同じ
 * 「テンプレート由来の加点だけでは超えられない水準」という考え方）。
 *
 * 並び順: 閾値超えセクション（代表スコア降順、同点は featured_priority昇順）
 * → 閾値以下セクション（featured_priority昇順、スコアの大小は無視）。
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
 * ダミー関数を渡せばよい）。一方、「閾値超えかどうか」の判定基準である
 * MIN_NOTABLE_SCORE 自体はアプリ全体で共有すべき表示ポリシーのため、
 * パラメータ化せずこのファイルから直接 import している。議案を持たない
 * セクション（本来ローダー側でフィルタ済みだが
 * 念のため）は代表スコアを負の無限大として扱い、閾値超え扱いにはならない
 * （featured_priority順の並びに合流する）。
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
      const aIsNotable = a.representativeScore > MIN_NOTABLE_SCORE;
      const bIsNotable = b.representativeScore > MIN_NOTABLE_SCORE;

      if (aIsNotable !== bIsNotable) {
        return aIsNotable ? -1 : 1;
      }
      if (aIsNotable) {
        return (
          b.representativeScore - a.representativeScore ||
          a.section.tag.priority - b.section.tag.priority
        );
      }
      return a.section.tag.priority - b.section.tag.priority;
    })
    .map(({ section }) => section);
}
