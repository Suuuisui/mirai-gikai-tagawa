import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getBillsByDietSession } from "@/features/bills/server/loaders/get-bills-by-diet-session";
import { DietSessionBillList } from "@/features/diet-sessions/client/components/diet-session-bill-list";
import { getDietSessionBySlug } from "@/features/diet-sessions/server/loaders/get-diet-session-by-slug";
import { routes } from "@/lib/routes";

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

  return {
    title: `${session.name}の議案一覧`,
    description: `${session.name}（${session.start_date}〜${session.end_date}）に提出された議案の一覧です。`,
    alternates: {
      canonical: routes.archiveSessionBills(slug),
    },
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
    <div className="bg-mirai-surface-muted" data-wide-column>
      {/* ヒーロー画像 */}
      <div className="relative w-full h-[285px]">
        <Image
          src="/img/archive-hero-7f3d06.png"
          alt={`${session.name}の議案一覧`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </div>

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
