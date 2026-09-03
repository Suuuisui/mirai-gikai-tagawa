import "server-only";
import type { CommitteeMeeting } from "../../shared/types";
import {
  type AdjacentMeetings,
  findAdjacentMeetings,
} from "../../shared/utils/committee-list";
import { getCommitteeMeetingById } from "./get-committee-meeting-by-id";
import { getCommitteeMeetingListItems } from "./get-committee-meeting-list-items";

interface CommitteeMeetingWithNeighbors {
  meeting: CommitteeMeeting;
  /** 同じ委員会の前後の会議（詳細ページの続きの導線） */
  neighbors: AdjacentMeetings;
}

/**
 * 詳細ページ用に、会議1件と同じ委員会の前後の会議をまとめて取得する。
 * 前後の探索には要約を含まない軽量な一覧のキャッシュを使う
 */
export async function getCommitteeMeetingWithNeighbors(
  id: string
): Promise<CommitteeMeetingWithNeighbors | null> {
  const [meeting, meetings] = await Promise.all([
    getCommitteeMeetingById(id),
    getCommitteeMeetingListItems(),
  ]);
  if (!meeting) return null;
  return { meeting, neighbors: findAdjacentMeetings(meetings, meeting) };
}
