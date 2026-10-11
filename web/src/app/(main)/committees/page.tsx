import type { Metadata } from "next";
import { CommitteeMeetingListPage } from "@/features/committees/server/components/committee-meeting-list-page";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映される
export const revalidate = 3600;

export const metadata: Metadata = {
  title: PAGE_COPY.committees.title,
  description: PAGE_COPY.committees.description,
  alternates: {
    canonical: routes.committees(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.committees,
    path: routes.committees(),
  }),
};

export default async function CommitteesPage() {
  const meetings = await getCommitteeMeetingListItems();

  return <CommitteeMeetingListPage meetings={meetings} />;
}
