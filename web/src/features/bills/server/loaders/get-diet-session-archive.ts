import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getAllDietSessions } from "@/features/diet-sessions/server/loaders/get-all-diet-sessions";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { countPublishedBillsGroupedByDietSession } from "../repositories/bill-repository";

export type DietSessionArchiveItem = {
  session: DietSession;
  billCount: number;
};

/**
 * 会期一覧ページ用のデータを取得する
 * 全会期を開始日の新しい順に、それぞれの公開済み議案数とあわせて返す
 */
export async function getDietSessionArchive(): Promise<
  DietSessionArchiveItem[]
> {
  const difficultyLevel = await getDifficultyLevel();
  const [sessions, billCounts] = await Promise.all([
    getAllDietSessions(),
    _getCachedBillCountsByDietSession(difficultyLevel),
  ]);

  return sessions.map((session) => ({
    session,
    billCount: billCounts[session.id] ?? 0,
  }));
}

// unstable_cache はキャッシュ結果をJSONシリアライズするため、Map ではなく
// プレーンオブジェクト（Record）で返す
const _getCachedBillCountsByDietSession = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum
  ): Promise<Record<string, number>> => {
    const counts =
      await countPublishedBillsGroupedByDietSession(difficultyLevel);
    return Object.fromEntries(counts);
  },
  ["bill-counts-by-diet-session"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
