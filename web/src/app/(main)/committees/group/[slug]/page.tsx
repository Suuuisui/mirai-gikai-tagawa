import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CommitteeGroupPage } from "@/features/committees/server/components/committee-group-page";
import { getCommitteeGroupPageData } from "@/features/committees/server/loaders/get-committee-group";
import { committeeGroupHref } from "@/features/committees/shared/utils/committee-groups";
import {
  buildCommitteeGroupDescription,
  buildCommitteeGroupJsonLd,
  buildCommitteeGroupTitle,
} from "@/features/committees/shared/utils/committee-seo";
import { env } from "@/lib/env";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

interface CommitteeGroupRouteProps {
  params: Promise<{
    slug: string;
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
}: CommitteeGroupRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCommitteeGroupPageData(slug);

  if (!data) {
    return {
      title: "委員会が見つかりません",
    };
  }

  // 「田川市 ○○委員会 議事録」のような検索の受け皿にするため、
  // 題名に委員会名と回数、説明に期間・回数・委員会の説明を入れる
  const { group } = data;
  const path = committeeGroupHref(group.committeeName);
  const title = buildCommitteeGroupTitle({
    committeeName: group.committeeName,
    meetingCount: group.meetings.length,
  });
  const description = buildCommitteeGroupDescription({
    committeeName: group.committeeName,
    meetingCount: group.meetings.length,
    period: group.period,
  });

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    ...buildPageShareMetadata({
      title,
      description,
      path,
    }),
  };
}

export default async function CommitteeGroupRoute({
  params,
}: CommitteeGroupRouteProps) {
  const { slug } = await params;
  const data = await getCommitteeGroupPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={buildCommitteeGroupJsonLd({
          committeeName: data.group.committeeName,
          meetings: data.group.meetings,
          baseUrl: env.webUrl,
        })}
      />
      <CommitteeGroupPage group={data.group} otherGroups={data.otherGroups} />
    </>
  );
}
