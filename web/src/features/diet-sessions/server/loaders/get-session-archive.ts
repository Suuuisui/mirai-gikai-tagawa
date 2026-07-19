import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import {
  type DietSessionBillStats,
  findBillStatsGroupedByDietSession,
} from "@/features/bills/server/repositories/bill-repository";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { getAllDietSessions } from "./get-all-diet-sessions";

export type SessionArchiveItem = {
  session: DietSession;
  billCount: number;
  splitVoteCount: number;
};

/**
 * 会期一覧ページ（/sessions）用に、全会期を開始日の新しい順に、
 * それぞれの公開済み議案数・賛否が分かれた議案数とあわせて取得する
 */
export async function getSessionArchive(): Promise<SessionArchiveItem[]> {
  const difficultyLevel = await getDifficultyLevel();
  const [sessions, stats] = await Promise.all([
    getAllDietSessions(),
    _getCachedBillStatsByDietSession(difficultyLevel),
  ]);

  return sessions.map((session) => {
    const stat = stats[session.id];
    return {
      session,
      billCount: stat?.billCount ?? 0,
      splitVoteCount: stat?.splitVoteCount ?? 0,
    };
  });
}

// unstable_cache はキャッシュ結果をJSONシリアライズするため、Map ではなく
// プレーンオブジェクト（Record）で返す
const _getCachedBillStatsByDietSession = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum
  ): Promise<Record<string, DietSessionBillStats>> => {
    const stats = await findBillStatsGroupedByDietSession(difficultyLevel);
    return Object.fromEntries(stats);
  },
  ["session-archive-bill-stats"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
