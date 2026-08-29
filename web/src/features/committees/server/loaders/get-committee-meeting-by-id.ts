import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommitteeMeeting } from "../../shared/types";
import { findCommitteeMeetingById } from "../repositories/committee-meetings-repository";

/** 委員会会議録をIDで1件取得（本文あり） */
export async function getCommitteeMeetingById(
  id: string
): Promise<CommitteeMeeting | null> {
  return _getCachedCommitteeMeetingById(id);
}

const _getCachedCommitteeMeetingById = unstable_cache(
  async (id: string): Promise<CommitteeMeeting | null> => {
    return findCommitteeMeetingById(id);
  },
  ["committee-meeting-by-id"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COMMITTEE_MEETINGS],
  }
);
