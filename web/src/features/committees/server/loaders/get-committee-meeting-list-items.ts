import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommitteeMeetingListItem } from "../../shared/types";
import { findAllCommitteeMeetingListItems } from "../repositories/committee-meetings-repository";

/**
 * 一覧の行・前後ナビ・出典リンク解決に使う軽量な会議一覧（開催日降順）。
 * 要約や要点を含む getCommitteeMeetings() とは別にキャッシュし、
 * 詳細ページや市長ページのたびに数百KBの一覧を読み直さないようにする
 */
export async function getCommitteeMeetingListItems(): Promise<
  CommitteeMeetingListItem[]
> {
  return _getCachedCommitteeMeetingListItems();
}

const _getCachedCommitteeMeetingListItems = unstable_cache(
  async (): Promise<CommitteeMeetingListItem[]> => {
    return findAllCommitteeMeetingListItems();
  },
  ["committee-meeting-list-items"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COMMITTEE_MEETINGS],
  }
);
