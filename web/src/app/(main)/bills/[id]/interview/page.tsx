import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getUserReportsByInterviewConfig } from "@/features/interview-report/server/loaders/get-user-reports-by-interview-config";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

export const dynamic = "force-dynamic";

interface InterviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: InterviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  const billName = bill.bill_content?.title ?? bill.name;
  const description = `議案についてのAIインタビュー - ${billName}`;
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  const title = `AIインタビュー - ${billName}`;

  return {
    title,
    description,
    alternates: {
      canonical: routes.interviewLP(bill.id),
    },
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.interviewLP(bill.id),
      image: { url: shareImageUrl, alt: `${billName} のAIインタビューページ` },
    }),
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { id } = await params;
  const [bill, interviewConfig] = await Promise.all([
    getBillById(id),
    getInterviewConfig(id),
  ]);

  if (!bill) {
    notFound();
  }

  if (!interviewConfig) {
    notFound();
  }

  // 最新のセッション情報とユーザーの過去レポートを取得
  const [latestSession, userReports] = await Promise.all([
    getLatestInterviewSession(interviewConfig.id),
    getUserReportsByInterviewConfig(interviewConfig.id),
  ]);

  return (
    <InterviewLPPage
      bill={bill}
      interviewConfig={interviewConfig}
      sessionInfo={latestSession}
      userReports={userReports}
    />
  );
}
