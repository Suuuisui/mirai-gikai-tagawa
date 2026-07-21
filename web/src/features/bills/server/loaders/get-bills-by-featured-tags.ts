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
// 直近の議案を上位N件表示する（本家「みらい議会」の会期絞り込みとは異なる仕様）。
// トップページの縦の長さを抑えるため3件に絞る（残りは各タグの
// 「すべて見る」リンクからタグ詳細ページで確認できる）
const BILLS_PER_TAG = 3;

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

    // セクション（タグ）の並び順は基本的に運営が設定した featured_priority の
    // 昇順。ただし否決・不信任決議など話題性の高い議案（興味度スコアが
    // MIN_NOTABLE_SCORE 超）を含むセクションだけは自動的に上位へ昇格する。
    // 詳細は sortBillsByTagSections のドキュメントを参照。
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
