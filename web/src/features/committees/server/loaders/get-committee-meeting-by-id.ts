import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommitteeMeeting } from "../../shared/types";
import { isCommitteeMeetingId } from "../../shared/utils/committee-meeting-id";
import { findCommitteeMeetingById } from "../repositories/committee-meetings-repository";

/**
 * 委員会会議録をIDで1件取得（本文あり）。
 * IDの形（UUID）でない値は、DBに問い合わせず「無い」を返す
 * （uuid 列に不正な値を渡すとエラーになり、404 ではなく 500 になるため）
 */
export async function getCommitteeMeetingById(
  id: string
): Promise<CommitteeMeeting | null> {
  if (!isCommitteeMeetingId(id)) return null;
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
