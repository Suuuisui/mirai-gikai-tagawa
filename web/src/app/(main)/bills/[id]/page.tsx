import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { resolveBillOgImageUrl } from "@/features/bills/shared/utils/bill-og-image";
import {
  buildBillMetaDescription,
  buildBillPageTitle,
} from "@/features/bills/shared/utils/bill-seo";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface BillDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: BillDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  // title/h1/OGタイトル/Article headlineで解決順を統一する
  // （やさしい見出し優先・未整備は正式議案名）。descriptionは正式議案名を
  // 先頭に置いて要約をスニペット長に切り詰める
  const title = buildBillPageTitle(bill);
  const description = buildBillMetaDescription(bill);

  // シェア用OGP画像。share_thumbnail_url/thumbnail_urlが未設定（＝カテゴリ共通の
  // デフォルトサムネイルのまま）の議案はBillCoverと同デザインの動的OG画像を、
  // 個別に画像差し替え済みの議案は既存のシェア画像URLを維持する
  const shareImageUrl = resolveBillOgImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.billDetail(bill.id),
    },
    openGraph: {
      title,
      description,
      siteName: "みらい議会＠田川市",
      url: routes.billDetail(bill.id),
      type: "article",
      publishedTime: bill.submitted_date ?? undefined,
      modifiedTime: bill.updated_at,
      images: [
        {
          // 個別サムネイル画像は寸法が一定でないため width/height は指定しない
          url: shareImageUrl,
          alt: `${title} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
    },
  };
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;
  const [billWithContent, currentDifficulty] = await Promise.all([
    getBillById(id),
    getDifficultyLevel(),
  ]);

  if (!billWithContent) {
    notFound();
  }

  const billUrl = new URL(
    routes.billDetail(billWithContent.id),
    env.webUrl
  ).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: buildBillPageTitle(billWithContent),
    alternativeHeadline: billWithContent.name,
    description: billWithContent.bill_content?.summary || undefined,
    // metadata（OGP）と同じ解決ロジックで画像を統一する
    image: resolveBillOgImageUrl(billWithContent, env.webUrl),
    datePublished: billWithContent.submitted_date ?? undefined,
    dateModified: billWithContent.updated_at,
    mainEntityOfPage: billUrl,
    author: {
      "@type": "Organization",
      name: "田川市政ラボ",
    },
    publisher: {
      "@type": "Organization",
      name: "みらい議会＠田川市",
    },
  };
  // パンくずのBreadcrumbListは、BillDetailLayout内の表示用Breadcrumbが
  // 同じitemsから自動出力する

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <BillDetailLayout
        bill={billWithContent}
        currentDifficulty={currentDifficulty}
      />
    </>
  );
}
