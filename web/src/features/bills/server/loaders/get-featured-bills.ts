import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import {
  findBillIdsWithPublicInterview,
  findFeaturedBillsWithContents,
  findTagsByBillIds,
} from "../repositories/bill-repository";

/**
 * 注目の議案を取得する
 * is_featured = true の公開済み議案を featured_priority 順に取得。
 * 田川市版の注目議案は運営が全会期を横断してキュレーションしているため、
 * upstream と異なりアクティブ会期での絞り込みは行わない
 * （絞ると過去会期の注目議案がセクションに表示されない）
 */
export async function getFeaturedBills(): Promise<BillWithContent[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();

  return _getCachedFeaturedBills(difficultyLevel, null);
}

const _getCachedFeaturedBills = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum,
    dietSessionId: string | null
  ): Promise<BillWithContent[]> => {
    const data = await findFeaturedBillsWithContents(
      difficultyLevel,
      dietSessionId
    );

    if (data.length === 0) {
      return [];
    }

    // タグ情報とインタビュー状態を一括取得
    const billIds = data.map((item: { id: string }) => item.id);
    const [tagsByBillId, interviewBillIds] = await Promise.all([
      findTagsByBillIds(billIds),
      findBillIdsWithPublicInterview(billIds),
    ]);

    // データ構造を整形
    return data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) || [],
        hasPublicInterview: interviewBillIds.has(item.id),
      };
    }) as BillWithContent[];
  },
  ["featured-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
