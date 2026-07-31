import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { BillOpinionsPage } from "@/features/user-topic-analysis/server/components/bill-opinions-page";

interface OpinionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR: adminのレポート公開・トピック公開アクションが web の /api/revalidate
// （billsタグ）を叩き、getBillById経由でbillsタグに依存する本ルートの
// キャッシュも即時破棄される。revalidateは配線外の更新（手動のデータ投入等）に
// 対するフォールバック
export const revalidate = 600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: OpinionsPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const title = bill?.bill_content?.title || bill?.name || "議案";

  return {
    title: `AIインタビューの回答一覧 - ${title}`,
    description: `${title}に寄せられたAIインタビューの回答一覧`,
  };
}

export default async function OpinionsPage({ params }: OpinionsPageProps) {
  const { id } = await params;
  return <BillOpinionsPage billId={id} />;
}
