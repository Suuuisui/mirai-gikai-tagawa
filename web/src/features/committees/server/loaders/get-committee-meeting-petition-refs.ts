import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CommitteeMeetingPetitionRef } from "../../shared/types";
import { findAllCommitteeMeetingPetitionRefs } from "../repositories/committee-meetings-repository";

/**
 * 請願・陳情のページで「どの会議で審査され、何が決まったか」を引くための
 * 会議の議題と要点（開催日の昇順）。一覧用の軽量キャッシュとは別に持つ
 */
export async function getCommitteeMeetingPetitionRefs(): Promise<
  CommitteeMeetingPetitionRef[]
> {
  return _getCachedCommitteeMeetingPetitionRefs();
}

const _getCachedCommitteeMeetingPetitionRefs = unstable_cache(
  async (): Promise<CommitteeMeetingPetitionRef[]> => {
    return findAllCommitteeMeetingPetitionRefs();
  },
  ["committee-meeting-petition-refs"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.COMMITTEE_MEETINGS],
  }
);
