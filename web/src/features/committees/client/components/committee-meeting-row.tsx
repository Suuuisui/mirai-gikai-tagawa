import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { getCommitteeProfile } from "../../shared/data/committee-profiles";
import { resolveTopics } from "../../shared/data/committee-topics";
import type { CommitteeMeetingListItem } from "../../shared/types";

interface CommitteeMeetingRowProps {
  meeting: CommitteeMeetingListItem;
  /** 委員会名を添える（複数委員会が混ざる一覧で使う） */
  showCommitteeName?: boolean;
}

/** 行に添えるテーマの上限。3つ以上付く記録もあるが、一覧では先頭の主なものだけ見せる */
const MAX_TOPIC_CHIPS = 2;

/**
 * 一覧の会議1件分。見出しを主役にして、日付・委員会・テーマを補足として添える。
 * 見出しが未生成の記録は日付だけでは中身が分からないため、その旨を示す
 */
export function CommitteeMeetingRow({
  meeting,
  showCommitteeName = false,
}: CommitteeMeetingRowProps) {
  const topics = resolveTopics(meeting.topics).slice(0, MAX_TOPIC_CHIPS);

  return (
    <Link
      href={routes.committeeMeeting(meeting.id) as Route}
      className="flex flex-col gap-1.5 py-3.5 transition-colors hover:bg-mirai-surface-key-subtle"
    >
      <p className="text-[15px] font-bold leading-relaxed text-mirai-text">
        {meeting.headline ?? "この回の見出しは準備中です"}
      </p>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
        <time
          dateTime={meeting.meeting_date}
          className="font-medium text-mirai-text-secondary"
        >
          {formatDateWithDots(meeting.meeting_date)}
        </time>
        {showCommitteeName && (
          <span className="font-medium text-mirai-text-secondary">
            {getCommitteeProfile(meeting.committee_name).shortName}
          </span>
        )}
        {topics.map((topic) => (
          <Badge key={topic.id} className="px-1.5 text-[11px] font-bold">
            {topic.label}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
