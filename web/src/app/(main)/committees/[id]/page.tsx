import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { truncateForSnippet } from "@/features/bills/shared/utils/bill-seo";
import { CommitteeMeetingDetailPage } from "@/features/committees/server/components/committee-meeting-detail-page";
import { getCommitteeMeetingById } from "@/features/committees/server/loaders/get-committee-meeting-by-id";
import { routes } from "@/lib/routes";

interface CommitteeMeetingPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映される
export const revalidate = 3600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: CommitteeMeetingPageProps): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getCommitteeMeetingById(id);

  if (!meeting) {
    return {
      title: "会議録が見つかりません",
    };
  }

  const title = `田川市議会 ${meeting.title}`;
  const description = meeting.summary
    ? truncateForSnippet(meeting.summary)
    : `田川市議会 ${meeting.committee_name}（${meeting.meeting_date}開催）の審議内容の記録です。`;

  return {
    title,
    description,
    alternates: {
      canonical: routes.committeeMeeting(meeting.id),
    },
    openGraph: {
      title,
      description,
      siteName: "みらい議会＠田川市",
      url: routes.committeeMeeting(meeting.id),
    },
  };
}

export default async function CommitteeMeetingPage({
  params,
}: CommitteeMeetingPageProps) {
  const { id } = await params;
  const meeting = await getCommitteeMeetingById(id);

  if (!meeting) {
    notFound();
  }

  return <CommitteeMeetingDetailPage meeting={meeting} />;
}
