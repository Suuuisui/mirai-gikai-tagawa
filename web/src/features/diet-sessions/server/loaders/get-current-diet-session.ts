import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { toDateString } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";
import { findCurrentDietSession } from "../repositories/diet-session-repository";

/**
 * 指定日時点で開催中の田川市議会会期を取得
 * 指定日が開始日と終了日の範囲内にある会期を返す
 */
export async function getCurrentDietSession(
  date: Date
): Promise<DietSession | null> {
  return _getCachedCurrentDietSession(toDateString(date));
}

const _getCachedCurrentDietSession = unstable_cache(
  async (targetDate: string): Promise<DietSession | null> => {
    return findCurrentDietSession(targetDate);
  },
  ["current-diet-session"],
  {
    revalidate: 3600, // 1時間（3600秒）
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
