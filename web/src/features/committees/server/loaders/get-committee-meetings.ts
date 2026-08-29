import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommitteeMeetingSummary } from "../../shared/types";
import { findAllCommitteeMeetings } from "../repositories/committee-meetings-repository";

/** 委員会会議録の一覧を取得（開催日降順・本文なし） */
export async function getCommitteeMeetings(): Promise<
  CommitteeMeetingSummary[]
> {
  return _getCachedCommitteeMeetings();
}

const _getCachedCommitteeMeetings = unstable_cache(
  async (): Promise<CommitteeMeetingSummary[]> => {
    return findAllCommitteeMeetings();
  },
  ["committee-meetings-list"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COMMITTEE_MEETINGS],
  }
);
