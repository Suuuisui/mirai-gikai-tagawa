import "server-only";

import {
  locateTopic,
  type TopicLocation,
} from "../../shared/utils/locate-topic";
import { getPublicTopicAnalysis } from "./get-public-topic-analysis";

/**
 * 議案の公開トピック分析から、指定トピックの詳細
 * （全件並びでの表示順・前後トピック含む）を取得する（generateMetadata 用）。
 * 公開版が無い、またはトピックが無ければ null。
 *
 * ?filter= 別の並びはページ本体が buildTopicNavByFilter
 * （shared/utils/topic-detail-nav.ts）で全フィルタ分を事前計算し、
 * Client 側（TopicNav）が URL のフィルタに応じて選択する。
 */
export async function getPublicTopicDetail(
  billId: string,
  topicId: string
): Promise<TopicLocation | null> {
  const analysis = await getPublicTopicAnalysis(billId);
  if (!analysis) return null;
  return locateTopic(analysis.topics, topicId);
}
