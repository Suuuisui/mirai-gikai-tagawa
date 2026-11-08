import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProposerBillsPage } from "@/features/members/server/components/proposer-bills-page";
import { countBillsByProposer } from "@/features/members/server/loaders/get-member-vote-data";
import {
  isProposerType,
  PROPOSER_DESCRIPTIONS,
  PROPOSER_LABELS,
} from "@/features/members/shared/utils/proposer";
import { routes } from "@/lib/routes";
import { describeProposerBills } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

type Props = {
  params: Promise<{ proposer: string }>;
};

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 時間では作り直さない。ページ数が多く、クローラーの巡回のたびに作り直すと Vercel の無料枠（ISR Writes・CPU）を使い切るため。データの更新はタグの再検証で、コードの更新はデプロイで反映する
export const revalidate = false;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { proposer } = await params;
  if (!isProposerType(proposer)) {
    return { title: "提出者が見つかりません" };
  }
  const label = PROPOSER_LABELS[proposer];
  const counts = await countBillsByProposer();
  const title = `${label}の議案一覧（田川市議会）`;
  const description = describeProposerBills({
    label,
    description: PROPOSER_DESCRIPTIONS[proposer],
    billCount: counts[proposer],
  });

  return {
    title,
    description,
    alternates: {
      canonical: routes.proposerBills(proposer),
    },
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.proposerBills(proposer),
    }),
  };
}

export default async function ProposerPage({ params }: Props) {
  const { proposer } = await params;
  if (!isProposerType(proposer)) {
    notFound();
  }
  return <ProposerBillsPage proposer={proposer} />;
}
