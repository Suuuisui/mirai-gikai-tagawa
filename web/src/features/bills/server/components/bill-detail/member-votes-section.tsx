import { ExternalLink } from "lucide-react";
import type { Bill } from "../../../shared/types";
import {
  countVotes,
  groupEntriesByFaction,
  parseMemberVotes,
  type MemberVoteValue,
} from "../../../shared/utils/member-votes";

interface MemberVotesSectionProps {
  bill: Bill;
}

// 賛否の表示ラベル。○=賛成 ×=反対 欠=欠席 −=議長職務・除斥などで採決に加わらず
const VOTE_LABEL: Record<MemberVoteValue, string> = {
  yes: "○",
  no: "×",
  absent: "欠",
  not_voting: "−",
};

// 賛成は既存の「賛成用の緑系」トークンが無いため最も濃いテキストトークンで、
// 反対は既存の赤系トークン（text-stance-against）で強調する。欠席・採決に
// 加わらずはグレースケールの濃淡で表現する（インラインカラーコード禁止のため）
const VOTE_TEXT_CLASS: Record<MemberVoteValue, string> = {
  yes: "text-mirai-text font-bold",
  no: "text-stance-against font-bold",
  absent: "text-mirai-text-muted",
  not_voting: "text-mirai-text-placeholder",
};

/**
 * 議員別の賛否セクション
 *
 * 田川市議会が「賛否が分かれた案件」についてのみ公開している、議員ごとの
 * 賛否（○×表）を会派別に一覧表示する。データが紐づいていない議案・
 * データ形式が不正な議案では何も表示しない
 */
export function MemberVotesSection({ bill }: MemberVotesSectionProps) {
  const memberVotes = parseMemberVotes(bill.member_votes);
  if (memberVotes === null) {
    return null;
  }

  const { entries, notes, sourceUrl } = memberVotes;
  const factionGroups = groupEntriesByFaction(entries);
  const { yes, no } = countVotes(entries);
  const absentCount = entries.filter((entry) => entry.vote === "absent").length;
  const notVotingCount = entries.filter(
    (entry) => entry.vote === "not_voting"
  ).length;

  return (
    <section className="my-8 rounded-md bg-white px-4 py-6">
      <h3 className="text-sm font-bold text-black">議員別の賛否</h3>
      <p className="mt-2 text-sm text-mirai-text">
        賛成{yes}・反対{no}
        {absentCount > 0 && `・欠席${absentCount}`}
        {notVotingCount > 0 && `・採決に加わらず${notVotingCount}`}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-mirai-border">
              <th className="px-2 py-1.5 text-left font-bold text-mirai-text-secondary">
                会派
              </th>
              <th className="px-2 py-1.5 text-left font-bold text-mirai-text-secondary">
                議員名
              </th>
              <th className="px-2 py-1.5 text-center font-bold text-mirai-text-secondary">
                賛否
              </th>
            </tr>
          </thead>
          <tbody>
            {factionGroups.map((group) =>
              group.members.map((member, index) => (
                <tr
                  key={`${group.faction}-${member.name}`}
                  className="border-b border-mirai-surface-muted"
                >
                  {index === 0 && (
                    <td
                      className="px-2 py-1.5 align-top text-mirai-text-secondary"
                      rowSpan={group.members.length}
                    >
                      {group.faction}
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-mirai-text">{member.name}</td>
                  <td
                    className={`px-2 py-1.5 text-center ${VOTE_TEXT_CLASS[member.vote]}`}
                  >
                    {VOTE_LABEL[member.vote]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-mirai-text-note">
        凡例: ○賛成　×反対　欠=欠席　−=採決に加わらず
      </p>

      {notes !== undefined && notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-mirai-text-note">
          {notes.map((note) => (
            <li key={note}>※ {note}</li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-mirai-text-note">
        ※賛否が分かれた案件のみ、市議会が議員別の賛否を公開しています
      </p>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-[3px] hover:opacity-70"
      >
        出典: 田川市議会 議決結果ページ
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
