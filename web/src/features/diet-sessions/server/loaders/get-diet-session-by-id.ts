import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findDietSessionById } from "../repositories/diet-session-repository";

/**
 * 議案詳細ページ等から「所属会期」へのリンクを表示するために、
 * 会期1件を軽量に取得する
 */
export async function getDietSessionById(
  id: string
): Promise<DietSession | null> {
  return _getCachedDietSessionById(id);
}

const _getCachedDietSessionById = unstable_cache(
  async (id: string): Promise<DietSession | null> => {
    return findDietSessionById(id);
  },
  ["diet-session-by-id"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
