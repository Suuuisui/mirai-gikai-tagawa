import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import {
  findBillIdsWithPublicInterview,
  findPublishedBillsByDietSession,
  findTagsByBillIds,
} from "@/features/bills/server/repositories/bill-repository";
import type { BillWithContent } from "@/features/bills/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findDietSessionById } from "../repositories/diet-session-repository";

export type SessionSummaryData = {
  session: DietSession;
  bills: BillWithContent[];
} | null;

/**
 * 会期まとめページ（/sessions/[id]）用に、会期1件とその会期に提出された
 * 公開済み議案（タグ・議員別賛否込み）を取得する
 */
export async function getSessionSummary(
  sessionId: string
): Promise<SessionSummaryData> {
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedSessionSummary(sessionId, difficultyLevel);
}

const _getCachedSessionSummary = unstable_cache(
  async (
    sessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<SessionSummaryData> => {
    const session = await findDietSessionById(sessionId);
    if (!session) {
      return null;
    }

    const data = await findPublishedBillsByDietSession(
      sessionId,
      difficultyLevel
    );

    if (!data || data.length === 0) {
      return { session, bills: [] };
    }

    // タグ情報とインタビュー状態を一括取得
    const billIds = data.map((item) => item.id);
    const [tagsByBillId, interviewBillIds] = await Promise.all([
      findTagsByBillIds(billIds),
      findBillIdsWithPublicInterview(billIds),
    ]);

    const bills: BillWithContent[] = data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) ?? [],
        hasPublicInterview: interviewBillIds.has(item.id),
      };
    });

    return { session, bills };
  },
  ["session-summary"],
  {
    revalidate: 600, // 10分
    tags: [
      CACHE_TAGS.BILLS,
      CACHE_TAGS.DIET_SESSIONS,
      CACHE_TAGS.INTERVIEW_CONFIGS,
    ],
  }
);
