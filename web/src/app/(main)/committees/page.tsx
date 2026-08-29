import type { Metadata } from "next";
import { CommitteeMeetingListPage } from "@/features/committees/server/components/committee-meeting-list-page";
import { getCommitteeMeetings } from "@/features/committees/server/loaders/get-committee-meetings";
import { routes } from "@/lib/routes";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映される
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "田川市議会 委員会の記録",
  description:
    "田川市議会の総務文教委員会・百条委員会（特別委員会）など、公式には公開されていない委員会の議事録・審議内容を、情報開示請求で入手した文書と公式YouTube中継をもとに公開しています。",
  alternates: {
    canonical: routes.committees(),
  },
};

export default async function CommitteesPage() {
  const meetings = await getCommitteeMeetings();

  return <CommitteeMeetingListPage meetings={meetings} />;
}
