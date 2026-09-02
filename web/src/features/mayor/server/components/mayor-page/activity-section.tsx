import { SectionHeading } from "@/components/ui/section-heading";
import { ShowMoreList } from "@/components/ui/show-more-list";
import { CommitteeMeetingRow } from "@/features/committees/client/components/committee-meeting-row";
import type { CommitteeMeetingSummary } from "@/features/committees/shared/types";
import { MAYOR_POINT_PATTERNS } from "../../../shared/data/mayor-profile";
import { pickPointsMatching } from "../../../shared/utils/mayor-activity";

interface ActivitySectionProps {
  meetings: CommitteeMeetingSummary[];
}

/** 就任後に開かれた委員会の記録を、市長に関わる要点を添えて並べる */
export function ActivitySection({ meetings }: ActivitySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>就任後、議会で何が動いたか</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        就任日以降に開かれた委員会の記録です。新しい順に並び、市長に関わる要点を添えています。
      </p>
      {meetings.length === 0 ? (
        <p className="rounded-lg bg-mirai-surface px-4 py-5 text-sm text-mirai-text-secondary">
          就任後の委員会の記録はまだありません。
        </p>
      ) : (
        <ShowMoreList initialCount={10} className="flex flex-col gap-3">
          {meetings.map((meeting) => {
            const points = pickPointsMatching(
              meeting.key_points,
              MAYOR_POINT_PATTERNS
            );
            return (
              <div
                key={meeting.id}
                className="rounded-lg border border-mirai-border-muted bg-white px-4"
              >
                <CommitteeMeetingRow meeting={meeting} showCommitteeName />
                {points.length > 0 && (
                  <ul className="mb-4 flex flex-col gap-1.5 border-l-2 border-mirai-border-muted pl-3">
                    {points.map((point, index) => (
                      <li
                        key={`${meeting.id}-${index}`}
                        className="text-sm leading-relaxed text-mirai-text-secondary"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </ShowMoreList>
      )}
    </section>
  );
}
