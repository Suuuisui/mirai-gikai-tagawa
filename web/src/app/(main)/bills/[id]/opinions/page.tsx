import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { BillOpinionsPage } from "@/features/user-topic-analysis/server/components/bill-opinions-page";
import { getPublicBillRespondents } from "@/features/user-topic-analysis/server/loaders/get-public-bill-respondents";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

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
  // 回答の取得はページ本体と React cache() で共有され、クエリは重複しない
  const [bill, respondents] = await Promise.all([
    getBillById(id),
    getPublicBillRespondents(id),
  ]);
  const billName = bill?.bill_content?.title || bill?.name || "議案";
  const title = `AIインタビューの回答一覧 - ${billName}`;
  const description = `${billName}に寄せられたAIインタビューの回答一覧`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.billOpinions(id),
    },
    // 公開されている回答がまだ無い議案は、検索結果に出さない
    ...(respondents.length === 0 && { robots: { index: false, follow: true } }),
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.billOpinions(id),
      image: { url: shareImageUrl, alt: `${billName} のOGPイメージ` },
    }),
  };
}

export default async function OpinionsPage({ params }: OpinionsPageProps) {
  const { id } = await params;
  return <BillOpinionsPage billId={id} />;
}
