import { routes } from "@/lib/routes";
import { OPERATOR_NAME } from "@/lib/seo/organization-json-ld";
import {
  countCharacters,
  DESCRIPTION_MIN_LENGTH,
  fitDescription,
} from "@/lib/seo/page-description";
import { SITE_NAME } from "@/lib/seo/share-metadata";
import { formatJapaneseEraDate } from "@/lib/utils/japanese-era";
import { getCommitteeProfile } from "../data/committee-profiles";
import type { CommitteeMeeting, CommitteeMeetingListItem } from "../types";
import { committeeGroupHref, formatPeriodLabel } from "./committee-groups";
import { groupMeetingsByYear } from "./group-meetings-by-year";

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
 * 会議の見出し。見出しが無い（null・空文字）記録は、会議名と日付を見出しの代わりにする。
 * Article の headline と、委員会ごとのページの ItemList の項目名が同じ文字になる
 */
function headlineOrFallback(
  meeting: Pick<
    CommitteeMeeting,
    "committee_name" | "meeting_date" | "headline"
  >
): string {
  return (
    meeting.headline ||
    `田川市議会 ${meeting.committee_name}（${formatMeetingDate(meeting.meeting_date)}）`
  );
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: headlineOrFallback(meeting),
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

/** 委員会ごとのページの題名・説明・構造化データに使う、委員会と会議数 */
interface CommitteeGroupSeoInput {
  committeeName: string;
  meetingCount: number;
}

/**
 * 委員会ごとのページの題名。「田川市議会 ○○委員会の記録」で何のページかが分かり、
 * 検索で探されやすい言葉（委員会名・記録）を先頭に置く。回数は題名の末尾に添える
 */
export function buildCommitteeGroupTitle({
  committeeName,
  meetingCount,
}: CommitteeGroupSeoInput): string {
  const { shortName } = getCommitteeProfile(committeeName);
  return `田川市議会 ${shortName}の記録（${meetingCount}回）`;
}

/** 説明が 80 字に満たないときだけ足す一文（委員会の説明が短い会議向け） */
const GROUP_DESCRIPTION_NOTE =
  "各回のページで、その日の議題と主な要点、もとにした資料を確認できます。";

/**
 * 委員会ごとのページの description（80〜120 字、「。」で終わる）。
 * 先頭に期間・回数・「見出しと要点つきで掲載」を置き、委員会の説明（profile.description）を
 * 文の切れ目で入る分だけ足す。委員会の説明が短くて 80 字に満たないときは補足の一文を足す。
 * 説明を足す側にしているので、説明が長い委員会でも期間と回数は必ず残る
 */
export function buildCommitteeGroupDescription({
  committeeName,
  meetingCount,
  period,
}: CommitteeGroupSeoInput & {
  /** 開催期間（meeting_date の最古〜最新） */
  period: { from: string; to: string };
}): string {
  const { description } = getCommitteeProfile(committeeName);
  const coverage = `${formatPeriodLabel(period)}の${meetingCount}回分の記録を、見出しと要点つきで掲載しています。`;

  // min: 0 は、文の切れ目で収まらなくても「…」で切らず、入る文までで止めるため
  const packed = fitDescription(`${coverage}${description}`, { min: 0 });
  if (countCharacters(packed) >= DESCRIPTION_MIN_LENGTH) return packed;
  return fitDescription(`${packed}${GROUP_DESCRIPTION_NOTE}`);
}

/**
 * 委員会ごとのページの ItemList 構造化データ。その委員会の会議を、ページに並べる順
 * （新しい順）に載せる。項目名は会議の見出し（無ければ会議名と日付）、url は絶対 URL。
 * 記録に無い項目（評価・順位・執筆者の個人名など）は入れない
 */
export function buildCommitteeGroupJsonLd({
  committeeName,
  meetings,
  baseUrl,
}: Pick<CommitteeGroupSeoInput, "committeeName"> & {
  meetings: readonly CommitteeMeetingListItem[];
  /** サイトの URL（絶対 URL の基準） */
  baseUrl: string;
}): Record<string, unknown> {
  const { shortName } = getCommitteeProfile(committeeName);
  const ordered = groupMeetingsByYear(meetings).flatMap(
    (group) => group.meetings
  );
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `田川市議会 ${shortName}の記録`,
    url: new URL(committeeGroupHref(committeeName), baseUrl).toString(),
    numberOfItems: ordered.length,
    itemListElement: ordered.map((meeting, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: headlineOrFallback(meeting),
      url: new URL(routes.committeeMeeting(meeting.id), baseUrl).toString(),
    })),
  };
}
