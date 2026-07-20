import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface BillDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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

  // bill_contentのsummaryがあればそれを使用、なければデフォルト値を使用
  const description = bill.bill_content?.summary || "議案の詳細情報";
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();

  // シェア用OGP画像（share_thumbnail_url > thumbnail_url > デフォルト）
  // ページ表示用のthumbnail_urlとは別に、SNSシェア用の画像を優先
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  return {
    title: bill.name,
    description: description,
    alternates: {
      canonical: routes.billDetail(bill.id),
    },
    openGraph: {
      title: bill.name,
      description: description,
      type: "article",
      publishedTime: bill.submitted_date ?? undefined,
      modifiedTime: bill.updated_at,
      images: [
        {
          url: shareImageUrl,
          alt: `${bill.name} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: bill.name,
      description: description,
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
    headline: billWithContent.bill_content?.title || billWithContent.name,
    description: billWithContent.bill_content?.summary || undefined,
    image:
      billWithContent.share_thumbnail_url ||
      billWithContent.thumbnail_url ||
      new URL("/ogp.jpg", env.webUrl).toString(),
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
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: env.webUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: billWithContent.name,
        item: billUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <BillDetailLayout
        bill={billWithContent}
        currentDifficulty={currentDifficulty}
      />
    </>
  );
}
