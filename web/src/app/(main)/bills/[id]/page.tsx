import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import { resolveBillOgImageUrl } from "@/features/bills/shared/utils/bill-og-image";
import {
  buildBillMetaDescription,
  buildBillPageTitle,
  buildBillSearchTitle,
  findDuplicateBillTitles,
} from "@/features/bills/shared/utils/bill-seo";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { OPERATOR_NAME } from "@/lib/seo/organization-json-ld";
import { buildPageShareMetadata, SITE_NAME } from "@/lib/seo/share-metadata";

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
  // 全議案の軽量一覧（キャッシュ済み）は、題名が重なる議案を見つけるのに使う
  const [bill, allBills] = await Promise.all([getBillById(id), getBillsLite()]);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  // title/h1/OGタイトル/Article headlineは、やさしい見出し優先・未整備は正式議案名で
  // 解決順を統一する。ただし<title>とOGタイトルは、同じ題名の議案が他にもあるとき
  // （別の会期の「令和3年度田川市一般会計補正予算」など）だけ、議案番号と日付を添えて
  // 検索結果で区別できるようにする。descriptionは正式議案名を先頭に置いて
  // 要約をスニペット長に切り詰める
  const title = buildBillSearchTitle(bill, findDuplicateBillTitles(allBills));
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
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.billDetail(bill.id),
      type: "article",
      publishedTime: bill.submitted_date ?? undefined,
      modifiedTime: bill.updated_at,
      // 個別サムネイル画像は寸法が一定でないため width/height は指定しない
      image: { url: shareImageUrl, alt: `${title} のOGPイメージ` },
    }),
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
      name: OPERATOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
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
