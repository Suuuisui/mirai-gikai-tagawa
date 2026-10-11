import { ExternalLink, Info, Landmark, Youtube } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { GlossarySection } from "@/features/glossary/server/components/glossary-section";
import { pickGlossaryTerms } from "@/features/glossary/shared/data/glossary";
import { officialMinutesIndex } from "@/features/official-minutes/shared/utils/official-minutes-index";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { SOURCE_KINDS } from "@/features/sources/shared/data/source-kinds";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { getCommitteeProfile } from "../../shared/data/committee-profiles";
import { resolveTopics } from "../../shared/data/committee-topics";
import type { CommitteeMeeting } from "../../shared/types";
import type { AdjacentMeetings } from "../../shared/utils/committee-list";
import {
  COMMITTEE_SOURCES,
  parseSourceNote,
} from "../../shared/utils/committee-source";
import { NeighborNav } from "./neighbor-nav";

interface CommitteeMeetingDetailPageProps {
  meeting: CommitteeMeeting;
  /** 同じ委員会の前後の会議（無ければ両方 null） */
  neighbors: AdjacentMeetings;
}

export function CommitteeMeetingDetailPage({
  meeting,
  neighbors,
}: CommitteeMeetingDetailPageProps) {
  const profile = getCommitteeProfile(meeting.committee_name);
  const committeeLabel = profile.shortName;
  const topics = resolveTopics(meeting.topics);
  const source = COMMITTEE_SOURCES[meeting.source_type];
  const sourceNote = parseSourceNote(meeting.source_note);
  const isTranscript = source.kind === "transcript";
  // 会議録検索システムに載るのは本会議だけ（委員会の会議録は公開されていない）
  const officialMinutes = meeting.committee_name.startsWith("本会議")
    ? officialMinutesIndex.findByDate(meeting.meeting_date)
    : null;
  const sourceDetail = isTranscript
    ? `YouTube中継の${sourceNote.usesSpeechRecognition ? "音声認識" : "自動字幕"}`
    : source.detail;
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
            {committeeLabel}
            <span className="ml-2 font-medium text-mirai-text-secondary">
              {formatDateWithDots(meeting.meeting_date)}
            </span>
          </p>
          <h1 className="mt-1.5 text-2xl font-bold leading-relaxed text-mirai-text">
            {meeting.headline ??
              `${formatDateWithDots(meeting.meeting_date)} の会議`}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            {profile.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* テーマは同じテーマの記録一覧への入口にする */}
            {topics.map((topic) => (
              <Badge
                key={topic.id}
                asChild
                className="bg-white px-2.5 py-1 font-bold hover:bg-mirai-surface-key-subtle"
              >
                <Link href={routes.committeesByTopic(topic.id) as Route}>
                  {topic.label}の記録
                </Link>
              </Badge>
            ))}
          </div>
          {/* この記録が何をもとにしているか（本文を読む前に分かるよう見出しのすぐ下に置く） */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-xs font-bold text-mirai-text-secondary">
              この記録のもと
            </span>
            <SourceBadge
              kind={source.kind}
              detail={sourceDetail}
              className="px-2.5 py-1"
            />
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-10">
          {/* 要約（この会議で何が起きたか） */}
          {meeting.summary && (
            <section className="flex flex-col gap-4">
              <SectionHeading>この会議で何があったか</SectionHeading>
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
                    {isTranscript
                      ? "発言などが確認できた議員（中継の文字起こしから）"
                      : "出席した議員"}
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
          <GlossarySection entries={glossary} />

          {/* 会議録・中継動画・全文（原典への導線） */}
          <section className="flex flex-col gap-4">
            <SectionHeading>もとの記録を確認する</SectionHeading>
            {officialMinutes && (
              <div className="flex flex-col gap-1.5">
                <a
                  href={officialMinutes.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  <Landmark aria-hidden className="size-4 shrink-0" />
                  公式の会議録を読む（会議録検索システム）
                  <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                </a>
                {isTranscript && (
                  <p className="text-xs leading-relaxed text-mirai-text-note">
                    この日の本会議は公式の会議録が公開されています。このページの要約は中継の文字起こしをもとにしているので、正確な発言は会議録で確かめてください。
                  </p>
                )}
              </div>
            )}
            {sourceNote.videos.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-mirai-text">
                  <Youtube aria-hidden className="size-4 shrink-0" />
                  公式YouTubeの中継（録画）
                </p>
                <ul className="flex flex-col gap-1.5 pl-6">
                  {sourceNote.videos.map((video) => (
                    <li key={video.url}>
                      <TextLink external href={video.url} className="text-sm">
                        {video.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              meeting.youtube_url && (
                <a
                  href={meeting.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  <Youtube aria-hidden className="size-4 shrink-0" />
                  公式YouTubeで中継を見る
                  <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                </a>
              )
            )}
            {meeting.minutes_text && (
              <details className="rounded-lg border border-mirai-border bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-primary">
                  {isTranscript
                    ? "文字起こしの全文を開く（長文）"
                    : "記録の全文を開く（長文）"}
                </summary>
                {isTranscript && (
                  <p className="border-t border-mirai-border-muted px-4 pt-4 text-xs leading-relaxed text-mirai-text-note">
                    ※中継の音声を機械で文字にしたものをそのまま載せているため、人名・地名・数字などに誤りが含まれます。正確な発言は中継映像でご確認ください。
                  </p>
                )}
                <div className="whitespace-pre-wrap border-t border-mirai-border-muted px-4 py-4 text-sm leading-relaxed text-mirai-text-secondary">
                  {meeting.minutes_text}
                </div>
              </details>
            )}
          </section>

          {/* 同じ委員会の前後の会議（読み終えた人が続きをたどれるように） */}
          <NeighborNav
            committeeLabel={committeeLabel}
            committeeName={meeting.committee_name}
            neighbors={neighbors}
          />

          {/* 出典・注意書き */}
          <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <p>
                このページは、{source.basis}
                をもとに、運営者がAIを活用して整理・要約したものです。
                {isTranscript && SOURCE_KINDS.transcript.caution}
                {sourceNote.text && ` ${sourceNote.text}`}
                {!isTranscript && "正確な内容は原本をご確認ください。"}
                誤りに気づかれた場合はお問い合わせからご連絡ください。
              </p>
              <TextLink href={routes.sources() as Route} className="text-xs">
                出典の種類と読み方について
              </TextLink>
            </div>
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
              label: `${committeeLabel}（${formatDateWithDots(meeting.meeting_date)}）`,
            },
          ]}
        />
      </Container>
    </div>
  );
}
