import type { Metadata } from "next";
import { ReportCompletePage } from "@/features/interview-report/server/components/report-complete-page";

// インタビューを終えた本人に見せる完了画面で、検索結果に出す意味がない
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface InterviewReportPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function InterviewReportPage({
  params,
}: InterviewReportPageProps) {
  const { reportId } = await params;

  return <ReportCompletePage reportId={reportId} />;
}
