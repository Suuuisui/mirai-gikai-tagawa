import type { Metadata } from "next";
import { SearchPage } from "@/features/search/server/components/search-page";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ?q= 付きの検索結果は、ミドルウェアが X-Robots-Tag: noindex を付ける
// （ページを動的にせず、静的なまま出し分けるため。lib/seo/robots-header.ts）
export const metadata: Metadata = {
  title: PAGE_COPY.search.title,
  description: PAGE_COPY.search.description,
  alternates: {
    canonical: routes.search(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.search,
    path: routes.search(),
  }),
};

export default function Page() {
  return <SearchPage />;
}
