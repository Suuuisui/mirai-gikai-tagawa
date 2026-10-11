import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { PublishedTopicPage } from "@/lib/seo/sitemap-entries";
import { findPublishedAnalysisBillIds } from "../repositories/published-topic-analysis-repository";
import { getPublicTopicAnalysis } from "./get-public-topic-analysis";

/**
 * 議案ごとにトピック分析を取得し、sitemap に必要な部分（トピックの ID と分析の日時）だけを残す。
 * 議案ごとの取得は並べて走らせ、1 件の失敗でほかの議案まで消さない（失敗は記録して飛ばす）。
 * 全議案の取得に失敗したときだけはエラーにする。空の結果をキャッシュに残さないため
 */
async function loadPublishedTopicPages(): Promise<PublishedTopicPage[]> {
  const billIds = await findPublishedAnalysisBillIds();
  const results = await Promise.allSettled(
    billIds.map((billId) => getPublicTopicAnalysis(billId))
  );

  const pages: PublishedTopicPage[] = [];
  let failedCount = 0;
  results.forEach((result, index) => {
    const billId = billIds[index];
    if (result.status === "rejected") {
      failedCount++;
      console.error(
        `getPublishedTopicPages: failed to load topic analysis (billId: ${billId})`,
        result.reason
      );
      return;
    }
    const analysis = result.value;
    if (!analysis || analysis.topics.length === 0) return;
    pages.push({
      billId,
      generatedAt: analysis.generated_at,
      topicIds: analysis.topics.map((topic) => topic.id),
    });
  });

  if (failedCount > 0 && failedCount === billIds.length) {
    throw new Error(
      `Failed to load topic analysis for all ${failedCount} published bills`
    );
  }
  return pages;
}

/**
 * 公開中のトピック分析ページ（議案ごと）と、そこに載るトピックのIDを取得する（sitemap 用）。
 * トピック一覧・詳細ページと同じ getPublicTopicAnalysis（表示時フィルタ適用後）を使うので、
 * 画面に「準備中」としか出ない議案や、表示されないトピックは含まれない。
 * 公開中のトピック分析が無ければ空配列。
 *
 * sitemap の再生成のたびに、全議案の意見本文まで取り直さないよう unstable_cache に載せる
 * （JSON にできる値だけを返す）。議案データの更新時は /api/revalidate（revalidateTag）で
 * 即時に失効するため、タイマーは長めの保険
 */
export const getPublishedTopicPages = unstable_cache(
  loadPublishedTopicPages,
  ["published-topic-pages"],
  {
    revalidate: 86400,
    tags: [CACHE_TAGS.BILLS],
  }
);
