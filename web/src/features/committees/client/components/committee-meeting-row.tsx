import { FileText, Youtube } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { getCommitteeProfile } from "../../shared/data/committee-profiles";
import type { CommitteeMeetingListItem } from "../../shared/types";

interface CommitteeMeetingRowProps {
  meeting: CommitteeMeetingListItem;
  /** 委員会名を添える（複数委員会が混ざる一覧で使う） */
  showCommitteeName?: boolean;
}

/**
 * 一覧の会議1件分。見出しを主役にして、日付・出典は補足として添える。
 * 見出しが未生成の記録は日付だけでは中身が分からないため、その旨を示す
 */
export function CommitteeMeetingRow({
  meeting,
  showCommitteeName = false,
}: CommitteeMeetingRowProps) {
  const SourceIcon = meeting.source_type === "disclosure" ? FileText : Youtube;

  return (
    <Link
      href={routes.committeeMeeting(meeting.id) as Route}
      className="flex flex-col gap-1 py-3.5 transition-colors hover:bg-mirai-surface-key-subtle"
    >
      <p className="text-[15px] font-bold leading-relaxed text-mirai-text">
        {meeting.headline ?? "この回の見出しは準備中です"}
      </p>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-mirai-text-muted">
        <time className="font-medium text-mirai-text-secondary">
          {formatDateWithDots(meeting.meeting_date)}
        </time>
        {showCommitteeName && (
          <span className="font-medium text-mirai-text-secondary">
            {getCommitteeProfile(meeting.committee_name).shortName ||
              meeting.committee_name}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <SourceIcon aria-hidden className="size-3.5" />
          {meeting.source_type === "disclosure" ? "開示文書" : "中継字幕"}
        </span>
      </div>
    </Link>
  );
}
