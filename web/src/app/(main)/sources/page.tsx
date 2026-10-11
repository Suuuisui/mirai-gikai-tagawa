import type { Metadata } from "next";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { SourcesPage } from "@/features/sources/server/components/sources-page";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: 委員会の記録の件数はキャッシュ済みの一覧から数える
export const revalidate = 3600;

export const metadata: Metadata = {
  title: PAGE_COPY.sources.title,
  description: PAGE_COPY.sources.description,
  alternates: {
    canonical: routes.sources(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.sources,
    path: routes.sources(),
  }),
};

export default async function SourcesRoute() {
  const meetings = await getCommitteeMeetingListItems();
  return <SourcesPage meetings={meetings} />;
}
