import type { Metadata } from "next";
import { MemberDetailPage } from "@/features/members/server/components/member-detail-page";
import { getBillsWithSponsors } from "@/features/members/server/loaders/get-member-vote-data";
import { resolveMemberDisplayName } from "@/features/members/shared/utils/resolve-member-display";
import { collectSponsorNames } from "@/features/members/shared/utils/sponsors";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ name: string }>;
};

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // 表示名はMEMBER_PROFILES（公式名簿）を優先し、無ければsponsorsデータ中で
  // フルネームが1つだけ見つかればそれを使う（member-detail-page.tsxのヘッダー
  // 表示と同じロジック）
  const sponsoredBills = await getBillsWithSponsors();
  const allSponsorNames = collectSponsorNames(
    sponsoredBills.map(({ sponsors }) => sponsors)
  );
  const displayName = resolveMemberDisplayName(decodedName, allSponsorNames);

  return {
    title: `${displayName} 議員の記録`,
    description: `田川市議会 ${decodedName} 議員が賛成・反対・欠席した議案の一覧です。賛否が分かれた案件での投票記録を公開データから確認できます。`,
    alternates: {
      canonical: routes.memberDetail(decodedName),
    },
  };
}

export default async function MemberPage({ params }: Props) {
  const { name } = await params;
  return <MemberDetailPage name={decodeURIComponent(name)} />;
}
