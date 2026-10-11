import { OPERATOR_NAME } from "@/lib/seo/organization-json-ld";
import { fitDescription } from "@/lib/seo/page-description";
import { SITE_NAME } from "@/lib/seo/share-metadata";
import { formatJapaneseEraDate } from "@/lib/utils/japanese-era";
import type { CommitteeMeeting } from "../types";

/** 検索結果・共有・構造化データに使う、会議の記録の項目 */
export type CommitteeMeetingSeoSource = Pick<
  CommitteeMeeting,
  "committee_name" | "meeting_date" | "headline" | "summary" | "updated_at"
>;

/** 会議の日付。和暦にできなければ元の文字列をそのまま使う */
function formatMeetingDate(meetingDate: string): string {
  return formatJapaneseEraDate(meetingDate) ?? meetingDate;
}

/**
 * 会議の記録ページの題名。
 * 内容が分かる見出しを先頭に置き、会議名と開催日（和暦）を続ける。
 * 同じ委員会の記録が並んでも、題名が重ならないよう日付を入れる。
 * 見出しが無い記録は、会議名と日付だけの題名にする
 */
export function buildCommitteeMeetingTitle(
  meeting: Pick<
    CommitteeMeeting,
    "committee_name" | "meeting_date" | "headline"
  >
): string {
  const date = formatMeetingDate(meeting.meeting_date);
  if (meeting.headline) {
    return `${meeting.headline}｜田川市議会 ${meeting.committee_name}（${date}）`;
  }
  return `田川市議会 ${meeting.committee_name}（${date}）の記録`;
}

/**
 * 会議の記録ページの description。要約の先頭を、文の切れ目で 120 字以内に収める。
 * 要約が無い記録は、会議名と開催日を伝える定型文にする
 */
export function buildCommitteeMeetingDescription(
  meeting: Pick<CommitteeMeeting, "committee_name" | "meeting_date" | "summary">
): string {
  if (meeting.summary) return fitDescription(meeting.summary);

  const date = formatMeetingDate(meeting.meeting_date);
  return fitDescription(
    `田川市議会の${meeting.committee_name}（${date}開催）の記録です。審議された議題と主な要点を、もとにした資料とあわせて確認できます。`
  );
}

/**
 * 会議の記録ページの Article 構造化データ（議案詳細と同じ形）。
 * datePublished は会議の開催日、publisher はサイト名。
 * 見出しが空文字の記録も、題名と同じく会議名と日付の見出しにする。
 * 記録に無い項目（執筆者の個人名・ロゴなど）は入れない
 */
export function buildCommitteeMeetingJsonLd({
  meeting,
  url,
  imageUrl,
}: {
  meeting: CommitteeMeetingSeoSource;
  /** ページの絶対 URL */
  url: string;
  /** 共有画像の絶対 URL */
  imageUrl: string;
}): Record<string, unknown> {
  const date = formatMeetingDate(meeting.meeting_date);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      meeting.headline || `田川市議会 ${meeting.committee_name}（${date}）`,
    description: buildCommitteeMeetingDescription(meeting),
    image: imageUrl,
    datePublished: meeting.meeting_date,
    dateModified: meeting.updated_at,
    inLanguage: "ja",
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: OPERATOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}
