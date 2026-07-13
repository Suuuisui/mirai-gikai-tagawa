import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillsByTag } from "../../shared/types";
import { mapBillsTagRowsToBills } from "../../shared/utils/map-bills-tag-rows";
import {
  findBillIdsWithPublicInterview,
  findPublishedBillsByTag,
  findTagById,
} from "../repositories/bill-repository";

/**
 * 指定タグに紐づく公開済み議案を、全会期を横断して議決日の新しい順に取得する
 * （「すべて見る」ページ用。ホームページのタグ横断セクションとは異なり件数制限なし）
 */
export async function getBillsByTag(tagId: string): Promise<BillsByTag | null> {
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillsByTag(tagId, difficultyLevel);
}

const _getCachedBillsByTag = unstable_cache(
  async (
    tagId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillsByTag | null> => {
    // タグ情報と議案データは互いに依存しないため並列取得する
    const [tag, data] = await Promise.all([
      findTagById(tagId),
      findPublishedBillsByTag(tagId, difficultyLevel, null),
    ]);

    if (!tag || !data) {
      return null;
    }

    const bills = mapBillsTagRowsToBills(data);
    const interviewBillIds = await findBillIdsWithPublicInterview(
      bills.map((b) => b.id)
    );

    return {
      tag: {
        id: tag.id,
        label: tag.label,
        description: tag.description ?? undefined,
        priority: -1,
      },
      bills: bills.map((bill) => ({
        ...bill,
        hasPublicInterview: interviewBillIds.has(bill.id),
      })),
    };
  },
  ["bills-by-tag"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
