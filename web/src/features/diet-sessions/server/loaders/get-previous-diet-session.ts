import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { toDateString } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";
import { findMostRecentConcludedDietSession } from "../repositories/diet-session-repository";

/**
 * 前回の田川市議会会期（直近で閉会した会期）を取得する。
 * 判定ロジックの詳細（is_active フラグに依存しない理由）は
 * findMostRecentConcludedDietSession を参照。
 * @param date 基準日（通常は getJapanTime() の結果を渡す）
 */
export async function getPreviousDietSession(
  date: Date
): Promise<DietSession | null> {
  return _getCachedPreviousDietSession(toDateString(date));
}

const _getCachedPreviousDietSession = unstable_cache(
  async (targetDate: string): Promise<DietSession | null> => {
    return findMostRecentConcludedDietSession(targetDate);
  },
  ["previous-diet-session"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
