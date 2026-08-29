import { ExternalLink, FileText, Info, Youtube } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { CommitteeMeeting } from "../../shared/types";
import { sourceTypeLabel } from "../../shared/utils/committee-meeting-parser";

interface CommitteeMeetingDetailPageProps {
  meeting: CommitteeMeeting;
}

export function CommitteeMeetingDetailPage({
  meeting,
}: CommitteeMeetingDetailPageProps) {
  return (
    <div>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <p className="text-sm font-bold text-primary-accent">
            {meeting.committee_name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-mirai-text">
            {meeting.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <time className="text-sm font-medium text-mirai-text-secondary">
              {formatDateWithDots(meeting.meeting_date)} 開催
            </time>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-0.5 text-xs font-medium text-mirai-text-secondary">
              {meeting.source_type === "disclosure" ? (
                <FileText aria-hidden className="size-3.5" />
              ) : (
                <Youtube aria-hidden className="size-3.5" />
              )}
              出典: {sourceTypeLabel(meeting.source_type)}
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-10">
          {/* 要約 */}
          {meeting.summary && (
            <section className="flex flex-col gap-4">
              <SectionHeading>この会議の概要</SectionHeading>
              <p className="leading-relaxed text-mirai-text">
                {meeting.summary}
              </p>
            </section>
          )}

          {/* 要点 */}
          {meeting.key_points.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeading>議論の要点</SectionHeading>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {meeting.key_points.map((point) => (
                  <li
                    key={point}
                    className="text-sm leading-relaxed text-mirai-text"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 議題 */}
          {meeting.agenda_items.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeading>議題</SectionHeading>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5">
                {meeting.agenda_items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-relaxed text-mirai-text"
                  >
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 出席者 */}
          {meeting.attendees.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeading>出席委員</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((name) => (
                  <span
                    key={name}
                    className="rounded-md bg-mirai-surface-tag px-2.5 py-1 text-xs font-medium text-mirai-text-secondary"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* YouTube中継 */}
          {meeting.youtube_url && (
            <section className="flex flex-col gap-4">
              <SectionHeading>中継動画</SectionHeading>
              <a
                href={meeting.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary underline underline-offset-4 hover:opacity-80"
              >
                <Youtube aria-hidden className="size-4" />
                公式YouTubeで中継を見る
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </section>
          )}

          {/* 全文 */}
          {meeting.minutes_text && (
            <section className="flex flex-col gap-4">
              <SectionHeading>記録全文</SectionHeading>
              <details className="rounded-lg border border-mirai-border bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
                  全文を開く（長文）
                </summary>
                <div className="whitespace-pre-wrap border-t border-mirai-border-muted px-4 py-4 text-sm leading-relaxed text-mirai-text-secondary">
                  {meeting.minutes_text}
                </div>
              </details>
            </section>
          )}

          {/* 出典・注意書き */}
          <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              このページは、
              {meeting.source_type === "disclosure"
                ? "田川市への情報開示請求により入手した文書"
                : "田川市議会の公式YouTube中継の自動字幕"}
              をもとに、運営者がAIを活用して整理・要約したものです。
              {meeting.source_note && ` ${meeting.source_note}`}
              正確な内容は原本・中継映像をご確認ください。誤りに気づかれた場合はお問い合わせからご連絡ください。
            </p>
          </div>
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "委員会の記録", href: routes.committees() },
            { label: meeting.title },
          ]}
        />
      </Container>
    </div>
  );
}
