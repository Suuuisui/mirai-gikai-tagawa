import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillsByTag } from "../../shared/types";
import { computeBillInterestScore } from "../../shared/utils/interest-score";
import { mapBillsTagRowsToBills } from "../../shared/utils/map-bills-tag-rows";
import { sortBillsByTagSections } from "../../shared/utils/sort-bills-by-tag-sections";
import {
  findBillIdsWithPublicInterview,
  findFeaturedTags,
  findPublishedBillsByTag,
} from "../repositories/bill-repository";

// ホームページのタグ横断セクションで各タグごとに表示する議案数
// 田川市議会は会期あたりの議案数が少ないため、会期を絞らず全会期横断で
// 直近の議案を上位N件表示する（本家「みらい議会」の会期絞り込みとは異なる仕様）
const BILLS_PER_TAG = 6;

/**
 * Featured表示用の議案をタグごとにグループ化して取得
 * featured_priorityが設定されているタグについて、全会期を横断して
 * 興味度スコア（interest-score.ts）が高い順に上位 BILLS_PER_TAG 件を取得する
 * （日付順だと補正予算等の定型議案ばかりになるため。タグ詳細ページは従来通り日付順）
 *
 * @param excludeBillIds 除外する議案ID（トップページの「注目の議案」セクション
 *   と重複させないため）。limit適用前にDB取得結果から除外するため、除外後も
 *   BILLS_PER_TAG件まで埋まる
 */
export async function getBillsByFeaturedTags(
  excludeBillIds: readonly string[] = []
): Promise<BillsByTag[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();

  // unstable_cacheの引数はキャッシュキーの一部としてシリアライズされるため、
  // Setではなく安定した順序の配列（ソート済み）で渡す
  return _getCachedBillsByFeaturedTags(
    difficultyLevel,
    [...excludeBillIds].sort()
  );
}

const _getCachedBillsByFeaturedTags = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum,
    excludeBillIds: string[]
  ): Promise<BillsByTag[]> => {
    const featuredTags = await findFeaturedTags();

    if (featuredTags.length === 0) {
      return [];
    }

    const excludeSet = new Set(excludeBillIds);

    // 各タグの議案を並列で取得（全会期横断、直近順に上位N件）
    const results = await Promise.all(
      featuredTags.map(async (tag) => {
        // トップページのタグ別議案一覧は興味度スコア順（interest-score.ts）に並べる。
        // タグ詳細ページ（get-bills-by-tag.ts）は従来通り日付順のまま変更しない。
        const data = await findPublishedBillsByTag(
          tag.id,
          difficultyLevel,
          null,
          BILLS_PER_TAG,
          "interest",
          excludeSet
        );

        if (!data || data.length === 0) {
          return null;
        }

        const bills = mapBillsTagRowsToBills(data);

        if (bills.length === 0) {
          return null;
        }

        return {
          tag: {
            id: tag.id,
            label: tag.label,
            description: tag.description ?? undefined,
            priority: tag.featured_priority ?? -1,
          },
          bills,
        };
      })
    );

    // nullを除外
    const filteredResults = results.filter(
      (result): result is NonNullable<typeof result> => result !== null
    );

    // 全議案のIDを収集してインタビュー状態を一括取得
    const allBillIds = filteredResults.flatMap((r) => r.bills.map((b) => b.id));
    const interviewBillIds = await findBillIdsWithPublicInterview(allBillIds);

    // インタビュー状態を付与
    const resultsWithInterview = filteredResults.map((result) => ({
      ...result,
      bills: result.bills.map((bill) => ({
        ...bill,
        hasPublicInterview: interviewBillIds.has(bill.id),
      })),
    }));

    // セクション（タグ）の並び順は featured_priority の固定順ではなく、
    // 各セクションの代表スコア（表示議案の興味度スコアの最大値）の降順にする。
    // 不信任決議ラッシュのように「今」政治的に熱いトピックがあれば、
    // そのセクションが自動的に上位に来るようにするため。
    // 同点時は featured_priority 昇順（従来の固定順）にフォールバックする。
    const now = new Date();
    return sortBillsByTagSections(resultsWithInterview, (bill) =>
      computeBillInterestScore(
        { ...bill, bill_contents: bill.bill_content },
        now
      )
    );
  },
  ["featured-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
