import type { Metadata } from "next";
import { MemberListPage } from "@/features/members/server/components/member-list-page";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

export const metadata: Metadata = {
  title: PAGE_COPY.members.title,
  description: PAGE_COPY.members.description,
  alternates: {
    canonical: routes.memberArchive(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.members,
    path: routes.memberArchive(),
  }),
};

export default function MembersPage() {
  return <MemberListPage />;
}
