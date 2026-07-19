import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSessionNavItem } from "../../shared/types";
import {
  type AdjacentSessions,
  findAdjacentSessions,
} from "../../shared/utils/session-summary";
import { findAllDietSessionsForNav } from "../repositories/diet-session-repository";

/**
 * 会期まとめページの「前後の会期ナビ」用に、指定した会期の前後の会期を取得する
 */
export async function getAdjacentSessions(
  sessionId: string
): Promise<AdjacentSessions> {
  const sessions = await _getCachedAllDietSessionsForNav();
  return findAdjacentSessions(sessions, sessionId);
}

const _getCachedAllDietSessionsForNav = unstable_cache(
  async (): Promise<DietSessionNavItem[]> => {
    return findAllDietSessionsForNav();
  },
  ["diet-sessions-nav"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
