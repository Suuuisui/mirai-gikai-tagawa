import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import type { PublicTopic } from "../types";
import {
  ALL_TOPIC_FILTERS,
  filterAndSortTopics,
  type TopicFilter,
  topicFilterLabel,
} from "./filter-topics";
import { locateTopic, type TopicLocation } from "./locate-topic";

/** 前後ナビの表示に必要な位置情報（トピック本体は含まない）。 */
export type TopicNavLocation = Omit<TopicLocation, "topic">;

/** フィルタごとの前後ナビ位置。キーは ?filter= の値（all 含む）。 */
export type TopicNavByFilter = Record<TopicFilter, TopicNavLocation>;

function toNavLocation(location: TopicLocation): TopicNavLocation {
  const { position, total, prevTopicId, nextTopicId } = location;
  return { position, total, prevTopicId, nextTopicId };
}

/**
 * 全フィルタ分の前後ナビ位置をまとめて求める純粋関数。
 * Server 側で事前計算して Client（TopicNav）へ渡すことで、全トピックの
 * 件数配列を RSC ペイロードに載せずに済む（フィルタは7種で固定サイズ）。
 *
 * フィルタ適用後の集合に対象トピックが無いフィルタは、全件の並びで算出する
 * （フィルタ付きURLで対象外のトピックを直接開いても詳細を辿れるようにするため）。
 * 対象トピック自体が存在しなければ null。
 */
export function buildTopicNavByFilter(
  topics: PublicTopic[],
  topicId: string
): TopicNavByFilter | null {
  const allLocation = locateTopic(topics, topicId);
  if (!allLocation) return null;

  const entries = ALL_TOPIC_FILTERS.map((filter) => {
    const location =
      locateTopic(filterAndSortTopics(topics, filter), topicId) ?? allLocation;
    return [filter, toNavLocation(location)] as const;
  });
  return Object.fromEntries(entries) as TopicNavByFilter;
}

/**
 * トピック詳細ページのパンくず項目を組み立てる純粋関数。
 * 一覧から引き継いだフィルタがあれば一覧ラベルに併記する
 * （例: 「トピック一覧（事業者）」）。
 */
export function topicDetailBreadcrumbItems(
  billId: string,
  filter: TopicFilter
): BreadcrumbItem[] {
  const filterLabel = topicFilterLabel(filter);
  return [
    { label: "議案詳細", href: routes.billDetail(billId) },
    {
      label: filterLabel ? `トピック一覧（${filterLabel}）` : "トピック一覧",
      href: routes.billTopics(billId),
    },
    { label: "トピック詳細" },
  ];
}
