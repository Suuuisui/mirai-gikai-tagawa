import type { Metadata } from "next";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { SourcesPage } from "@/features/sources/server/components/sources-page";
import { routes } from "@/lib/routes";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: 委員会の記録の件数はキャッシュ済みの一覧から数える
export const revalidate = 3600;

const TITLE = "情報のもと（出典）について";
const DESCRIPTION =
  "みらい議会＠田川市に載せている内容が、何をもとにしているかの説明です。田川市・田川市議会の公式サイトと本会議の会議録、公式YouTube中継の文字起こし、情報開示請求で入手した文書の3種類を、ページごとにバッジで示しています。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: routes.sources(),
  },
  ...buildPageShareMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: routes.sources(),
  }),
};

export default async function SourcesRoute() {
  const meetings = await getCommitteeMeetingListItems();
  return <SourcesPage meetings={meetings} />;
}
