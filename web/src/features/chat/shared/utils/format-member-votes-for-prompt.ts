import { VOTE_ARIA_LABEL } from "@/features/bills/shared/utils/member-vote-display";
import {
  countVotes,
  formatVoteCounts,
  groupEntriesByFaction,
  parseMemberVotes,
} from "@/features/bills/shared/utils/member-votes";

/**
 * bills.member_votes（jsonbカラム）の値を、チャットのシステムプロンプトに
 * 埋め込むためのテキストに整形する。
 *
 * データが無い/形式が不正な議案では空文字を返す（プロンプト側でセクション
 * ごと省略するため）。
 */
export function formatMemberVotesForPrompt(memberVotes: unknown): string {
  const parsed = parseMemberVotes(memberVotes);
  if (parsed === null) return "";

  const { entries } = parsed;
  const { yes, no } = countVotes(entries);
  const absentCount = entries.filter((entry) => entry.vote === "absent").length;
  const notVotingCount = entries.filter(
    (entry) => entry.vote === "not_voting"
  ).length;

  const countLine = [
    formatVoteCounts(yes, no).text,
    absentCount > 0 ? `欠席${absentCount}` : null,
    notVotingCount > 0 ? `採決に加わらず${notVotingCount}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join("・");

  const factionLines = groupEntriesByFaction(entries).map((group) => {
    const members = group.members
      .map((member) => `${member.name}(${VOTE_ARIA_LABEL[member.vote]})`)
      .join("、");
    return `${group.faction}: ${members}`;
  });

  return [countLine, ...factionLines].join("\n");
}
