import { ExternalLink } from "lucide-react";
import type { Bill } from "../../../shared/types";
import {
  countVotes,
  groupEntriesByFaction,
  type MemberVoteValue,
  parseMemberVotes,
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

// スクリーンリーダー向けの補足ラベル（グリフだけでは意味が伝わらないため）
const VOTE_ARIA_LABEL: Record<MemberVoteValue, string> = {
  yes: "賛成",
  no: "反対",
  absent: "欠席",
  not_voting: "採決に加わらず",
};

// チップの配色。賛成=緑系トークン、反対は既存の赤系トークン
// （bg-stance-against-bg / text-stance-against）を流用する。欠席・採決に
// 加わらずはグレースケールの濃淡で表現する（インラインカラーコード禁止のため）
const VOTE_CHIP_CLASS: Record<MemberVoteValue, string> = {
  yes: "bg-vote-for-bg text-vote-for",
  no: "bg-stance-against-bg text-stance-against",
  absent: "bg-mirai-surface-muted text-mirai-text-muted",
  not_voting: "bg-mirai-surface-muted text-mirai-text-placeholder",
};

/**
 * 議員別の賛否セクション
 *
 * 田川市議会が「賛否が分かれた案件」についてのみ公開している、議員ごとの
 * 賛否（○×表）を、比率バー＋会派別チップで一覧表示する。データが紐づいて
 * いない議案・データ形式が不正な議案では何も表示しない
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
  const decisiveCount = yes + no;

  return (
    <section className="my-8 rounded-md bg-white px-4 py-6">
      <h3 className="text-sm font-bold text-black">議員別の賛否</h3>
      <p className="mt-2 text-sm text-mirai-text">
        賛成{yes}・反対{no}
        {absentCount > 0 && `・欠席${absentCount}`}
        {notVotingCount > 0 && `・採決に加わらず${notVotingCount}`}
      </p>

      {/* 賛成・反対の比率バー（幅は票数比によるレイアウト計算のため style を使用。
          色指定はクラスで行っておりインラインカラーコードではない） */}
      {decisiveCount > 0 && (
        <div
          className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-mirai-surface-muted"
          role="img"
          aria-label={`賛成${yes}対反対${no}`}
        >
          <div className="basis-0 bg-vote-for" style={{ flexGrow: yes }} />
          <div className="basis-0 bg-stance-against" style={{ flexGrow: no }} />
        </div>
      )}

      {/* 会派別の議員名チップ */}
      <div className="mt-4 space-y-4">
        {factionGroups.map((group) => (
          <div key={group.faction}>
            <h4 className="text-xs font-bold text-mirai-text-secondary">
              {group.faction}
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {group.members.map((member) => (
                <span
                  key={member.name}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VOTE_CHIP_CLASS[member.vote]}`}
                >
                  {member.name}
                  <span aria-hidden="true">{VOTE_LABEL[member.vote]}</span>
                  <span className="sr-only">
                    （{VOTE_ARIA_LABEL[member.vote]}）
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <details className="mt-4 text-xs text-mirai-text-note">
        <summary className="cursor-pointer select-none text-mirai-text-secondary">
          注記・出典を見る
        </summary>
        <div className="mt-2 space-y-2">
          <p>凡例: ○賛成　×反対　欠=欠席　−=採決に加わらず</p>

          {notes !== undefined && notes.length > 0 && (
            <ul className="space-y-1">
              {notes.map((note) => (
                <li key={note}>※ {note}</li>
              ))}
            </ul>
          )}

          <p>※賛否が分かれた案件のみ、市議会が議員別の賛否を公開しています</p>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-[3px] hover:opacity-70"
          >
            出典: 田川市議会 議決結果ページ
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </details>
    </section>
  );
}
