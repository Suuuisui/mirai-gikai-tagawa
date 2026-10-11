import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { ItemListJsonLd } from "@/components/seo/item-list-json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getBillsByDietSession } from "@/features/bills/server/loaders/get-bills-by-diet-session";
import { buildBillPageTitle } from "@/features/bills/shared/utils/bill-seo";
import { DietSessionBillList } from "@/features/diet-sessions/client/components/diet-session-bill-list";
import { getDietSessionBySlug } from "@/features/diet-sessions/server/loaders/get-diet-session-by-slug";
import { routes } from "@/lib/routes";
import { describeSessionBills } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

type Props = {
  params: Promise<{ slug: string }>;
};

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const session = await getDietSessionBySlug(slug);

  if (!session) {
    return { title: "田川市議会会期が見つかりません" };
  }

  // 議案の取得はページ本体と同じキャッシュ済みのローダー
  const bills = await getBillsByDietSession(session.id);
  const title = `田川市議会 ${session.name}の議案一覧`;
  const description = describeSessionBills({
    name: session.name,
    startDate: session.start_date,
    endDate: session.end_date,
    billCount: bills.length,
  });

  return {
    title,
    description,
    alternates: {
      canonical: routes.archiveSessionBills(slug),
    },
    ...buildPageShareMetadata({
      title,
      description,
      path: routes.archiveSessionBills(slug),
    }),
  };
}

export default async function DietSessionBillsPage({ params }: Props) {
  const { slug } = await params;
  const session = await getDietSessionBySlug(slug);

  if (!session) {
    notFound();
  }

  const bills = await getBillsByDietSession(session.id);

  return (
    <div data-wide-column>
      <ItemListJsonLd
        items={bills.map((bill) => ({
          url: routes.billDetail(bill.id),
          name: buildBillPageTitle(bill),
        }))}
      />
      <Container className="py-8">
        <DietSessionBillList session={session} bills={bills} />
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "会期一覧", href: routes.archive() },
            { label: `${session.name}の議案一覧` },
          ]}
        />
      </Container>
    </div>
  );
}
