import type { Metadata } from "next";
import { MemberDetailPage } from "@/features/members/server/components/member-detail-page";
import { getBillsWithSponsors } from "@/features/members/server/loaders/get-member-vote-data";
import {
  collectSponsorNames,
  findUniqueFullName,
} from "@/features/members/shared/utils/sponsors";

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // sponsorsデータ中にこの議員の姓と一致するフルネームが1つだけ見つかれば
  // それをタイトルに使う（member-detail-page.tsxのヘッダー表示と同じロジック）
  const sponsoredBills = await getBillsWithSponsors();
  const allSponsorNames = collectSponsorNames(
    sponsoredBills.map(({ sponsors }) => sponsors)
  );
  const displayName =
    findUniqueFullName(allSponsorNames, decodedName) ?? decodedName;

  return {
    title: `${displayName} 議員の記録`,
    description: `田川市議会 ${decodedName} 議員が賛成・反対・欠席した議案の一覧です。賛否が分かれた案件での投票記録を公開データから確認できます。`,
  };
}

export default async function MemberPage({ params }: Props) {
  const { name } = await params;
  return <MemberDetailPage name={decodeURIComponent(name)} />;
}
