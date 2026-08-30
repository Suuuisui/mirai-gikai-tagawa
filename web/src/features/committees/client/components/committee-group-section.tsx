"use client";

import { ChevronDown, FileText, Youtube } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CommitteeGroup } from "../../shared/utils/committee-groups";
import { formatPeriodLabel } from "../../shared/utils/committee-groups";

interface CommitteeGroupSectionProps {
  group: CommitteeGroup;
}

/** 最初に見せる会議数。多い委員会は残りを折りたたむ */
const INITIAL_COUNT = 5;

/**
 * 委員会1つ分のカード。何を審議する場かの説明と開催期間を見せ、
 * 会議は新しい順に数件だけ展開して残りは畳む（一覧が縦に伸びすぎるのを防ぐ）
 */
export function CommitteeGroupSection({ group }: CommitteeGroupSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleMeetings = expanded
    ? group.meetings
    : group.meetings.slice(0, INITIAL_COUNT);
  const hiddenCount = group.meetings.length - visibleMeetings.length;

  return (
    <section
      id={`committee-${encodeURIComponent(group.committeeName)}`}
      className="scroll-mt-36 rounded-lg border border-mirai-border bg-white p-5"
    >
      <h2 className="text-lg font-bold text-mirai-text">{group.shortName}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-mirai-text-secondary">
        {group.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-mirai-surface-key px-2.5 py-1 font-bold text-primary-accent">
          {group.meetings.length}回の記録
        </span>
        <span className="rounded-md bg-mirai-surface px-2.5 py-1 font-medium text-mirai-text-secondary">
          {formatPeriodLabel(group.period)}
        </span>
        {group.disclosureCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-mirai-surface px-2.5 py-1 font-medium text-mirai-text-secondary">
            <FileText aria-hidden className="size-3.5" />
            開示文書 {group.disclosureCount}件
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-mirai-border-muted border-t border-mirai-border-muted">
        {visibleMeetings.map((meeting) => (
          <li key={meeting.id}>
            <Link
              href={routes.committeeMeeting(meeting.id) as Route}
              className="flex flex-col gap-1 py-3 transition-colors hover:bg-mirai-surface-key-subtle"
            >
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-sm font-bold text-mirai-text">
                  {formatDateWithDots(meeting.meeting_date)}
                </time>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-mirai-text-muted">
                  {meeting.source_type === "disclosure" ? (
                    <FileText aria-hidden className="size-3.5" />
                  ) : (
                    <Youtube aria-hidden className="size-3.5" />
                  )}
                  {meeting.source_type === "disclosure"
                    ? "開示文書"
                    : "中継字幕"}
                </span>
              </div>
              {meeting.summary && (
                <p className="line-clamp-2 text-sm leading-relaxed text-mirai-text-secondary">
                  {meeting.summary}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setExpanded(true)}
            className="h-10 gap-1.5 text-sm font-bold"
          >
            残り{hiddenCount}回の記録を見る
            <ChevronDown aria-hidden className="size-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
