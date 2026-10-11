import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { TopicListPage } from "@/features/user-topic-analysis/server/components/topic-list-page";
import { getPublicTopicAnalysis } from "@/features/user-topic-analysis/server/loaders/get-public-topic-analysis";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

interface TopicsPageProps {
  params: Promise<{ id: string }>;
}

// ISR: adminのトピック公開・レポート公開アクションが web の /api/revalidate
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
}: TopicsPageProps): Promise<Metadata> {
  const { id } = await params;
  // トピック分析の取得はページ本体と React cache() で共有され、クエリは重複しない
  const [bill, analysis] = await Promise.all([
    getBillById(id),
    getPublicTopicAnalysis(id),
  ]);
  const billName = bill?.bill_content?.title || bill?.name || "議案";
  const title = `議案のトピック一覧 - ${billName}`;
  const description = `${billName}に寄せられた意見をAIが整理したトピック一覧`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);
  // トピックがまだ無い議案は「準備中」と表示するだけの薄いページなので、検索結果に出さない
  const hasTopics = (analysis?.topics.length ?? 0) > 0;

  return {
    title,
    description,
    alternates: {
      canonical: routes.billTopics(id),
    },
    ...(!hasTopics && { robots: { index: false, follow: true } }),
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.billTopics(id),
      image: { url: shareImageUrl, alt: `${billName} のOGPイメージ` },
    }),
  };
}

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { id } = await params;
  return <TopicListPage billId={id} />;
}
