import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProposerBillsPage } from "@/features/members/server/components/proposer-bills-page";
import {
  isProposerType,
  PROPOSER_LABELS,
} from "@/features/members/shared/utils/proposer";

type Props = {
  params: Promise<{ proposer: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { proposer } = await params;
  if (!isProposerType(proposer)) {
    return { title: "提出者が見つかりません" };
  }
  const label = PROPOSER_LABELS[proposer];
  return {
    title: `${label}の議案一覧`,
    description: `田川市議会の${label}議案の一覧です。議決結果とあわせて確認できます。`,
  };
}

export default async function ProposerPage({ params }: Props) {
  const { proposer } = await params;
  if (!isProposerType(proposer)) {
    notFound();
  }
  return <ProposerBillsPage proposer={proposer} />;
}
