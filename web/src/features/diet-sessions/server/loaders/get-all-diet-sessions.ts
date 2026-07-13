import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findAllDietSessions } from "../repositories/diet-session-repository";

/**
 * 全ての田川市議会会期を開始日の新しい順に取得
 */
export async function getAllDietSessions(): Promise<DietSession[]> {
  return _getCachedAllDietSessions();
}

const _getCachedAllDietSessions = unstable_cache(
  async (): Promise<DietSession[]> => {
    return findAllDietSessions();
  },
  ["all-diet-sessions"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
