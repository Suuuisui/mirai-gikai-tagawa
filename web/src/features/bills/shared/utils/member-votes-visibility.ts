import type { Bill } from "../types";
import { parseMemberVotes } from "./member-votes";
import { resolveVoteDisclosure } from "./vote-disclosure";

/**
 * 議員別の賛否セクション（MemberVotesSection）が表示されるかを判定する
 * 純粋関数。目次（BillToc）に「議員別の賛否」項目を載せるかの判定に使う。
 *
 * MemberVotesSection本体の表示条件（賛否表あり／全会一致／無記名投票の
 * いずれかで表示、判定不能なら非表示）と一致させること
 */
export function isMemberVotesSectionVisible(
  bill: Pick<Bill, "member_votes" | "name" | "status_note">,
  sessionSlug: string | null
): boolean {
  if (parseMemberVotes(bill.member_votes) !== null) {
    return true;
  }

  const disclosure = resolveVoteDisclosure({
    hasMemberVotes: false,
    billName: bill.name,
    sessionSlug,
    statusNote: bill.status_note,
  });

  return disclosure === "unanimous" || disclosure === "secret_ballot";
}
