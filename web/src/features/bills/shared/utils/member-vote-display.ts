import type { MemberVoteValue } from "./member-votes";

/**
 * 議員別賛否の表示用定数。議案詳細の「議員別の賛否」セクションと
 * 議員ページ（features/members）で共用する
 */

// 賛否の表示ラベル。○=賛成 ×=反対 欠=欠席 −=議長職務・除斥などで採決に加わらず
export const VOTE_LABEL: Record<MemberVoteValue, string> = {
  yes: "○",
  no: "×",
  absent: "欠",
  not_voting: "−",
};

// スクリーンリーダー向けの補足ラベル（グリフだけでは意味が伝わらないため）
export const VOTE_ARIA_LABEL: Record<MemberVoteValue, string> = {
  yes: "賛成",
  no: "反対",
  absent: "欠席",
  not_voting: "採決に加わらず",
};

// チップの配色。賛成=緑系トークン、反対は既存の赤系トークン
// （bg-stance-against-bg / text-stance-against）を流用する。欠席・採決に
// 加わらずはグレースケールの濃淡で表現する（インラインカラーコード禁止のため）
export const VOTE_CHIP_CLASS: Record<MemberVoteValue, string> = {
  yes: "bg-vote-for-bg text-vote-for",
  no: "bg-stance-against-bg text-stance-against",
  absent: "bg-mirai-surface-muted text-mirai-text-muted",
  not_voting: "bg-mirai-surface-muted text-mirai-text-placeholder",
};
