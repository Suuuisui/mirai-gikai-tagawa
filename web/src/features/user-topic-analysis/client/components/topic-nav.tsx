"use client";

import { useSearchParams } from "next/navigation";
import { TopicNavView } from "../../shared/components/topic-nav-view";
import { parseTopicFilter } from "../../shared/utils/filter-topics";
import type { TopicNavByFilter } from "../../shared/utils/topic-detail-nav";

interface TopicNavProps {
  billId: string;
  /** Server 側で事前計算した、フィルタごとの前後ナビ位置。 */
  navByFilter: TopicNavByFilter;
}

/**
 * URLの ?filter= に対応する並びの前後ナビを表示する。
 * searchParams を Server Component で読むとページが動的レンダリングになり
 * ISRが効かなくなるため、フィルタの解決だけを Client 側で行う。
 */
export function TopicNav({ billId, navByFilter }: TopicNavProps) {
  const searchParams = useSearchParams();
  const filter = parseTopicFilter(searchParams.get("filter"));
  const location = navByFilter[filter];
  return (
    <TopicNavView
      billId={billId}
      position={location.position}
      total={location.total}
      prevTopicId={location.prevTopicId}
      nextTopicId={location.nextTopicId}
      filter={filter}
    />
  );
}
