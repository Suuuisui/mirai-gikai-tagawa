import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CommitteeMeetingListItem } from "../../shared/types";
import { committeeSectionId } from "../../shared/utils/committee-groups";
import type { AdjacentMeetings } from "../../shared/utils/committee-list";

interface NeighborNavProps {
  committeeLabel: string;
  committeeName: string;
  neighbors: AdjacentMeetings;
}

/** 同じ委員会の「前の会議／次の会議」と、委員会別一覧への導線 */
export function NeighborNav({
  committeeLabel,
  committeeName,
  neighbors,
}: NeighborNavProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-mirai-text-secondary">
        {committeeLabel}のほかの記録
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <NeighborLink meeting={neighbors.older} direction="older" />
        <NeighborLink meeting={neighbors.newer} direction="newer" />
      </div>
      <TextLink
        href={
          `${routes.committees()}#${committeeSectionId(committeeName)}` as Route
        }
        className="text-sm"
      >
        {committeeLabel}の記録一覧へ
        <ChevronRight aria-hidden className="size-4" />
      </TextLink>
    </section>
  );
}

interface NeighborLinkProps {
  meeting: CommitteeMeetingListItem | null;
  direction: "older" | "newer";
}

function NeighborLink({ meeting, direction }: NeighborLinkProps) {
  const isOlder = direction === "older";
  const label = isOlder ? "前の会議" : "次の会議";
  if (!meeting) {
    return (
      <div className="rounded-lg border border-dashed border-mirai-border-muted px-4 py-3 text-xs text-mirai-text-muted">
        {isOlder ? "これより前の記録はありません" : "これが最新の記録です"}
      </div>
    );
  }
  return (
    <Link
      href={routes.committeeMeeting(meeting.id) as Route}
      className="flex flex-col gap-1 rounded-lg border border-mirai-border-muted bg-white px-4 py-3 transition-colors hover:bg-mirai-surface-key-subtle"
    >
      <span className="flex items-center gap-1 text-xs font-bold text-primary-accent">
        {isOlder && <ChevronLeft aria-hidden className="size-3.5" />}
        {label}
        <time
          dateTime={meeting.meeting_date}
          className="font-medium text-mirai-text-muted"
        >
          {formatDateWithDots(meeting.meeting_date)}
        </time>
        {!isOlder && <ChevronRight aria-hidden className="size-3.5" />}
      </span>
      <span className="text-sm font-bold leading-relaxed text-mirai-text">
        {meeting.headline ?? "この回の見出しは準備中です"}
      </span>
    </Link>
  );
}
