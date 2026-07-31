"use client";

import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { parseTopicFilter } from "../../shared/utils/filter-topics";
import { topicDetailBreadcrumbItems } from "../../shared/utils/topic-detail-nav";

/**
 * URLの ?filter= に応じて一覧ラベルへフィルタ名を併記するパンくず。
 * searchParams を Server Component で読むとISRが効かなくなるため、
 * Client 側でフィルタを解決する。
 */
export function TopicDetailBreadcrumb({ billId }: { billId: string }) {
  const searchParams = useSearchParams();
  const filter = parseTopicFilter(searchParams.get("filter"));
  return <Breadcrumb items={topicDetailBreadcrumbItems(billId, filter)} />;
}
