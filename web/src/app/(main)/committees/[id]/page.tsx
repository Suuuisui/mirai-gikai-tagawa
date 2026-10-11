import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CommitteeMeetingDetailPage } from "@/features/committees/server/components/committee-meeting-detail-page";
import { getCommitteeMeetingById } from "@/features/committees/server/loaders/get-committee-meeting-by-id";
import { getCommitteeMeetingWithNeighbors } from "@/features/committees/server/loaders/get-committee-meeting-with-neighbors";
import {
  buildCommitteeMeetingDescription,
  buildCommitteeMeetingJsonLd,
  buildCommitteeMeetingTitle,
} from "@/features/committees/shared/utils/committee-seo";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import {
  buildPageShareMetadata,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo/share-metadata";

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

  // 検索結果でも中身が伝わるよう、見出し＋会議名＋開催日の題名にし、
  // 説明は要約の先頭（文の切れ目で120字以内）にする
  const title = buildCommitteeMeetingTitle(meeting);
  const description = buildCommitteeMeetingDescription(meeting);

  return {
    title,
    description,
    alternates: {
      canonical: routes.committeeMeeting(meeting.id),
    },
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.committeeMeeting(meeting.id),
      type: "article",
      publishedTime: meeting.meeting_date,
      modifiedTime: meeting.updated_at,
    }),
  };
}

export default async function CommitteeMeetingPage({
  params,
}: CommitteeMeetingPageProps) {
  const { id } = await params;
  const result = await getCommitteeMeetingWithNeighbors(id);

  if (!result) {
    notFound();
  }

  const url = new URL(
    routes.committeeMeeting(result.meeting.id),
    env.webUrl
  ).toString();
  const imageUrl = new URL(DEFAULT_OG_IMAGE.url, env.webUrl).toString();

  return (
    <>
      <JsonLd
        data={buildCommitteeMeetingJsonLd({
          meeting: result.meeting,
          url,
          imageUrl,
        })}
      />
      <CommitteeMeetingDetailPage
        meeting={result.meeting}
        neighbors={result.neighbors}
      />
    </>
  );
}
