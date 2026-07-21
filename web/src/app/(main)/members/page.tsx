import type { Metadata } from "next";
import { MemberListPage } from "@/features/members/server/components/member-list-page";

export const metadata: Metadata = {
  title: "議員・提出者から見る",
  description:
    "田川市議会の議員ごとの賛否（賛成・反対・欠席）と、市長・議員・委員会など提出者別の議案一覧。誰が提出し、誰が賛成・反対したのかを公開データから確認できます。",
};

export default function MembersPage() {
  return <MemberListPage />;
}
