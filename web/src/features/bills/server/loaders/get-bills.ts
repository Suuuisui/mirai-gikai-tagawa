import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContentLite } from "../../shared/types";
import {
  findBillIdsWithPublicInterview,
  findPublishedBillsLiteWithContents,
  findTagsByBillIds,
} from "../repositories/bill-repository";

/**
 * 公開済み議案の全件一覧を軽量フィールド（bill_contents.contentなし）で取得する。
 *
 * content込みの全件レスポンスは約2.2MBあり、Vercel Data Cacheの
 * 1エントリ2MB上限を超えてキャッシュ自体が保存されず、ISR再生成のたびに
 * Supabaseから全件を引き直していた（クローラー巡回で月間Egress上限を超過）。
 * 本文が必要な画面は個別議案のローダー（getBillById等）を使うこと。
 *
 * React cache() でリクエスト内の呼び出しを重複排除する（unstable_cacheには
 * リクエスト内メモ化が無く、generateMetadataとページ本体・同一ページ内の
 * 複数ローダーが並行で呼ぶとData Cache読みとmiss時のDBアクセスが多重になる）
 */
export const getBillsLite = cache(async (): Promise<BillWithContentLite[]> => {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillsLite(difficultyLevel);
});

const _getCachedBillsLite = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContentLite[]> => {
    const data = await findPublishedBillsLiteWithContents(difficultyLevel);

    // タグ情報とインタビュー状態を一括取得
    const billIds = data.map((item) => item.id);
    const [tagsByBillId, interviewBillIds] = await Promise.all([
      findTagsByBillIds(billIds),
      findBillIdsWithPublicInterview(billIds),
    ]);

    const bills: BillWithContentLite[] = data.map((item) => {
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

    return bills;
  },
  ["bills-list-lite"],
  {
    // データ更新はadmin操作時の/api/revalidate（revalidateTag）で即時反映される
    // ため、タイマーは保険。Egress削減のため短い間隔での引き直しはしない
    revalidate: 3600,
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
