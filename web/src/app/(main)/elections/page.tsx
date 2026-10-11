import type { Metadata } from "next";
import { ElectionTurnoutPage } from "@/features/elections/server/components/election-turnout-page";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

export const metadata: Metadata = {
  title: PAGE_COPY.elections.title,
  description: PAGE_COPY.elections.description,
  alternates: {
    canonical: routes.elections(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.elections,
    path: routes.elections(),
  }),
};

export default function ElectionsPage() {
  return <ElectionTurnoutPage />;
}
