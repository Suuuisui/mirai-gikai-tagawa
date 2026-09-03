import { findAdjacentBills } from "@/features/bills/shared/utils/adjacent-bills";
import type { CommitteeMeetingListItem } from "../types";

/**
 * 指定トピックを含む会議だけに絞る。topicIdがnullなら素通し。
 * 絞り込んだ会議ではそのトピックを topics の先頭に置き、一覧のチップで
 * 「なぜこの一覧にいるか」が最初に見えるようにする
 */
export function filterByTopic(
  meetings: readonly CommitteeMeetingListItem[],
  topicId: string | null
): CommitteeMeetingListItem[] {
  if (!topicId) return [...meetings];
  return meetings
    .filter((meeting) => meeting.topics.includes(topicId))
    .map((meeting) => ({
      ...meeting,
      topics: [topicId, ...meeting.topics.filter((id) => id !== topicId)],
    }));
}

/** 開催日の新しい順に並べる（同日は委員会名の五十音順） */
export function sortByDateDesc(
  meetings: readonly CommitteeMeetingListItem[]
): CommitteeMeetingListItem[] {
  return [...meetings].sort(
    (a, b) =>
      b.meeting_date.localeCompare(a.meeting_date) ||
      a.committee_name.localeCompare(b.committee_name, "ja")
  );
}

export interface AdjacentMeetings {
  /** 同じ委員会の1つ前（古い側）の会議 */
  older: CommitteeMeetingListItem | null;
  /** 同じ委員会の1つ後（新しい側）の会議 */
  newer: CommitteeMeetingListItem | null;
}

/**
 * 同じ委員会の前後の会議を返す（詳細ページの「前の会議／次の会議」用）。
 * 一覧に current が無ければ両方 null
 */
export function findAdjacentMeetings(
  meetings: readonly CommitteeMeetingListItem[],
  current: Pick<CommitteeMeetingListItem, "id" | "committee_name">
): AdjacentMeetings {
  const sameCommittee = sortByDateDesc(
    meetings.filter((m) => m.committee_name === current.committee_name)
  );
  // 新しい順に並べているので、配列上の previous が新しい側、next が古い側
  const { previous, next } = findAdjacentBills(sameCommittee, current.id);
  return { older: next, newer: previous };
}
