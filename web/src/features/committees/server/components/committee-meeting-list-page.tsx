import { FileText, Youtube } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CommitteeMeetingSummary } from "../../shared/types";
import { groupMeetingsByCommittee } from "../../shared/utils/committee-meeting-parser";

interface CommitteeMeetingListPageProps {
  meetings: CommitteeMeetingSummary[];
}

export function CommitteeMeetingListPage({
  meetings,
}: CommitteeMeetingListPageProps) {
  const groups = groupMeetingsByCommittee(meetings);

  return (
    <div data-wide-column>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">委員会の記録</h1>
          <p className="mt-1 text-sm text-mirai-text-muted">
            公式には公開されていない田川市議会の委員会の記録を、情報開示請求で入手した文書と公式YouTube中継からまとめています
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-12">
          {groups.map(({ committeeName, meetings: groupMeetings }) => (
            <section key={committeeName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <SectionHeading>{committeeName}</SectionHeading>
                <p className="text-xs text-mirai-text-muted">
                  {groupMeetings.length}回分の記録
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {groupMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={routes.committeeMeeting(meeting.id) as Route}
                  >
                    <Card className="flex flex-col gap-2 border-mirai-border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-wrap items-center gap-3">
                        <time className="text-sm font-bold text-mirai-text">
                          {formatDateWithDots(meeting.meeting_date)}
                        </time>
                        <span className="inline-flex items-center gap-1 rounded-md bg-mirai-surface-tag px-2.5 py-0.5 text-xs font-medium text-mirai-text-secondary">
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
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {groups.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              委員会の記録はまだありません
            </p>
          )}
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "委員会の記録" },
          ]}
        />
      </Container>
    </div>
  );
}
