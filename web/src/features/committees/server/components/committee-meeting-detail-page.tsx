import { BookOpen, ExternalLink, FileText, Info, Youtube } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { pickGlossaryTerms } from "../../shared/data/committee-glossary";
import { getCommitteeProfile } from "../../shared/data/committee-profiles";
import type { CommitteeMeeting } from "../../shared/types";
import { sourceTypeLabel } from "../../shared/utils/committee-meeting-parser";

interface CommitteeMeetingDetailPageProps {
  meeting: CommitteeMeeting;
}

export function CommitteeMeetingDetailPage({
  meeting,
}: CommitteeMeetingDetailPageProps) {
  const profile = getCommitteeProfile(meeting.committee_name);
  const glossary = pickGlossaryTerms([
    meeting.summary ?? "",
    ...meeting.key_points,
    ...meeting.agenda_items,
  ]);

  return (
    <div>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <p className="text-sm font-bold text-primary-accent">
            {profile.shortName || meeting.committee_name}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-relaxed text-mirai-text">
            {formatDateWithDots(meeting.meeting_date)} の会議
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            {profile.description}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-mirai-text-secondary">
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
          {/* 要約（この会議で何が起きたか） */}
          {meeting.summary && (
            <section className="flex flex-col gap-4">
              <SectionHeading>この会議で決まったこと</SectionHeading>
              <p className="rounded-lg bg-mirai-surface-key-subtle p-5 text-[15px] leading-loose text-mirai-text">
                {meeting.summary}
              </p>
            </section>
          )}

          {/* 要点（番号付きで読み進めやすく） */}
          {meeting.key_points.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeading>詳しい内容</SectionHeading>
              <ol className="flex flex-col gap-3">
                {meeting.key_points.map((point, index) => (
                  <li
                    key={point}
                    className="flex gap-3 rounded-lg border border-mirai-border-muted bg-white p-4"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mirai-surface-key text-xs font-bold text-primary-accent">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-mirai-text">
                      {point}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 議題・出席者（補足情報として横並び） */}
          {(meeting.agenda_items.length > 0 ||
            meeting.attendees.length > 0) && (
            <section className="flex flex-col gap-6 md:flex-row md:gap-8">
              {meeting.agenda_items.length > 0 && (
                <div className="flex flex-1 flex-col gap-3">
                  <h2 className="text-sm font-bold text-mirai-text-secondary">
                    この日の議題
                  </h2>
                  <ol className="flex list-decimal flex-col gap-1.5 pl-5">
                    {meeting.agenda_items.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed text-mirai-text-secondary"
                      >
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {meeting.attendees.length > 0 && (
                <div className="flex flex-1 flex-col gap-3">
                  <h2 className="text-sm font-bold text-mirai-text-secondary">
                    出席した議員
                  </h2>
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
                </div>
              )}
            </section>
          )}

          {/* 議会用語の解説（この会議の内容に出てくるものだけ） */}
          {glossary.length > 0 && (
            <section className="flex flex-col gap-3 rounded-lg border border-mirai-border-muted bg-mirai-surface px-5 py-4">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-mirai-text">
                <BookOpen aria-hidden className="size-4 text-primary-accent" />
                このページに出てくる議会のことば
              </h2>
              <dl className="flex flex-col gap-3">
                {glossary.map((entry) => (
                  <div key={entry.term} className="flex flex-col gap-0.5">
                    <dt className="text-sm font-bold text-mirai-text">
                      {entry.term}
                    </dt>
                    <dd className="text-xs leading-relaxed text-mirai-text-secondary">
                      {entry.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* 中継動画・全文（原典への導線） */}
          <section className="flex flex-col gap-4">
            <SectionHeading>もとの記録を確認する</SectionHeading>
            {meeting.youtube_url && (
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
            )}
            {meeting.minutes_text && (
              <details className="rounded-lg border border-mirai-border bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
                  記録の全文を開く（長文）
                </summary>
                <div className="whitespace-pre-wrap border-t border-mirai-border-muted px-4 py-4 text-sm leading-relaxed text-mirai-text-secondary">
                  {meeting.minutes_text}
                </div>
              </details>
            )}
          </section>

          {/* 出典・注意書き */}
          <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              このページは、
              {meeting.source_type === "disclosure"
                ? "田川市への情報開示請求により入手した文書"
                : "田川市議会の公式YouTube中継の自動字幕"}
              をもとに、運営者がAIを活用して整理・要約したものです。
              {meeting.source_type === "youtube" &&
                "自動字幕には聞き取りの誤りが含まれる場合があります。"}
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
            {
              label: `${profile.shortName || meeting.committee_name}（${formatDateWithDots(meeting.meeting_date)}）`,
            },
          ]}
        />
      </Container>
    </div>
  );
}
