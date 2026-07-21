import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findAdjacentBills } from "../../shared/utils/adjacent-bills";
import { findPublishedBillsByDietSession } from "../repositories/bill-repository";

export type AdjacentSessionBill = {
  id: string;
  name: string;
  title: string;
};

export type AdjacentSessionBills = {
  previous: AdjacentSessionBill | null;
  next: AdjacentSessionBill | null;
};

/**
 * 議案詳細ページ（/bills/[id]）の前後ナビゲーション用に、同じ会期内で
 * 表示順（会期まとめページの全議案リストと同じ status_order 昇順→
 * submitted_date 降順）で前後にあたる議案を取得する。
 * 会期内の議案一覧は (dietSessionId, difficultyLevel) 単位でキャッシュし、
 * 前後判定（billIdに依存する部分）はキャッシュの外で行う
 */
export async function getAdjacentSessionBills(
  billId: string,
  dietSessionId: string
): Promise<AdjacentSessionBills> {
  const difficultyLevel = await getDifficultyLevel();
  const bills = await _getCachedSessionBillNavItems(
    dietSessionId,
    difficultyLevel
  );

  return findAdjacentBills(bills, billId);
}

const _getCachedSessionBillNavItems = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<AdjacentSessionBill[]> => {
    const data = await findPublishedBillsByDietSession(
      dietSessionId,
      difficultyLevel
    );

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => {
      const billContent = Array.isArray(item.bill_contents)
        ? item.bill_contents[0]
        : item.bill_contents;

      return {
        id: item.id,
        name: item.name,
        title: billContent?.title || item.name,
      };
    });
  },
  ["adjacent-session-bill-nav-items"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
