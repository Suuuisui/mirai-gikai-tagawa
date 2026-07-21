import type { Metadata } from "next";
import { MemberDetailPage } from "@/features/members/server/components/member-detail-page";

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  return {
    title: `${decodedName} 議員の賛否`,
    description: `田川市議会 ${decodedName} 議員が賛成・反対・欠席した議案の一覧です。賛否が分かれた案件での投票記録を公開データから確認できます。`,
  };
}

export default async function MemberPage({ params }: Props) {
  const { name } = await params;
  return <MemberDetailPage name={decodeURIComponent(name)} />;
}
