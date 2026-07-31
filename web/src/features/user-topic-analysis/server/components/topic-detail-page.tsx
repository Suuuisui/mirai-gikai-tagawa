import "server-only";

import { Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { countPublicReportsByBillId } from "@/features/interview-report/server/repositories/interview-report-repository";
import { routes } from "@/lib/routes";
import { TopicDetailBreadcrumb } from "../../client/components/topic-detail-breadcrumb";
import { TopicNav } from "../../client/components/topic-nav";
import { TopicOpinionList } from "../../client/components/topic-opinion-list";
import {
  TopicCategoryChips,
  TopicSentiment,
} from "../../shared/components/topic-meta";
import { TopicNavView } from "../../shared/components/topic-nav-view";
import { locateTopic } from "../../shared/utils/locate-topic";
import { splitSummaryLines } from "../../shared/utils/split-summary-lines";
import {
  buildTopicNavByFilter,
  topicDetailBreadcrumbItems,
} from "../../shared/utils/topic-detail-nav";
import { getPublicTopicAnalysis } from "../loaders/get-public-topic-analysis";

interface TopicDetailPageProps {
  billId: string;
  topicId: string;
}

export async function TopicDetailPage({
  billId,
  topicId,
}: TopicDetailPageProps) {
  const [bill, analysis, publicReportCount, interviewConfig] =
    await Promise.all([
      getBillById(billId),
      getPublicTopicAnalysis(billId),
      countPublicReportsByBillId(billId),
      getInterviewConfig(billId),
    ]);

  if (!bill || !analysis) {
    notFound();
  }

  // トピック本体（全件並び）と、?filter= 別の前後ナビ位置を導出する。
  // フィルタの解決は Client 側（TopicNav）で行うため、全フィルタ分を事前計算して渡す。
  const detail = locateTopic(analysis.topics, topicId);
  const navByFilter = buildTopicNavByFilter(analysis.topics, topicId);
  if (!detail || !navByFilter) {
    notFound();
  }

  // 相対日時はサーバーで基準時刻を固定し、クライアントでの再計算ずれを防ぐ。
  const nowMs = Date.now();

  const { topic } = detail;
  const billTitle = bill.bill_content?.title || bill.name;

  return (
    <div className="min-h-dvh bg-mirai-surface">
      <Container>
        <div className="flex flex-col gap-6 pb-8 md:pt-8">
          {/* パンくず + 議案タイトル。
              パンくずと前後ナビは ?filter= に依存するため Client 側で解決する
              （Server Component で searchParams を読むと動的レンダリングに戻り
              ISRが効かなくなる）。Suspense フォールバックにはフィルタ無し（all）の
              内容を出し、静的HTMLにもパンくず・前後リンクが含まれるようにする */}
          <div className="flex flex-col gap-2">
            <Suspense
              fallback={
                <Breadcrumb items={topicDetailBreadcrumbItems(billId, "all")} />
              }
            >
              <TopicDetailBreadcrumb billId={billId} />
            </Suspense>
            <Link
              href={routes.billDetail(billId) as Route}
              className="inline-flex items-center gap-2 text-[15px] font-medium leading-6 text-black"
            >
              <span className="underline">{billTitle}</span>
              <Undo2 className="size-4 shrink-0" />
            </Link>
          </div>

          <h1 className="text-[22px] font-bold leading-9 text-mirai-text">
            💬トピックに含まれる意見
          </h1>

          <Suspense
            fallback={
              <TopicNavView billId={billId} filter="all" {...navByFilter.all} />
            }
          >
            <TopicNav billId={billId} navByFilter={navByFilter} />
          </Suspense>

          {/* トピックヘッダー */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-5">
            <h2 className="text-base font-bold leading-6 text-mirai-text">
              {topic.title}
              <span className="ml-1 text-[11px] font-medium text-topic-count">
                （{topic.opinion_count}件）
              </span>
            </h2>
            <TopicSentiment sentiment={topic.sentiment} />
            <TopicCategoryChips topic={topic} />
            {topic.description && (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-6 text-mirai-text">
                {splitSummaryLines(topic.description).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 意見一覧 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-topic-label">
              このトピックに含まれる{topic.opinion_count}件の意見
            </h3>
            <TopicOpinionList
              opinions={topic.opinions}
              publicReportCount={publicReportCount}
              nowMs={nowMs}
            />
          </div>

          {/* AIインタビューCTA */}
          {interviewConfig != null && (
            <InterviewLandingSection billId={billId} />
          )}
        </div>
      </Container>
    </div>
  );
}
