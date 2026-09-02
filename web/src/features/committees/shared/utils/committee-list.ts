import type {
  CommitteeMeetingListItem,
  CommitteeMeetingSummary,
} from "../types";

/**
 * 一覧のClient Componentへ渡す項目だけを取り出す。
 * 要約・要点・議題まで渡すとRSCのペイロードが数百KBになるため落とす
 */
export function toListItems(
  meetings: readonly CommitteeMeetingSummary[]
): CommitteeMeetingListItem[] {
  return meetings.map((meeting) => ({
    id: meeting.id,
    committee_name: meeting.committee_name,
    meeting_date: meeting.meeting_date,
    headline: meeting.headline,
    topics: meeting.topics,
    source_type: meeting.source_type,
  }));
}

/** 指定トピックを含む会議だけに絞る。topicIdがnullなら素通し */
export function filterByTopic(
  meetings: readonly CommitteeMeetingListItem[],
  topicId: string | null
): CommitteeMeetingListItem[] {
  if (!topicId) return [...meetings];
  return meetings.filter((meeting) => meeting.topics.includes(topicId));
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
