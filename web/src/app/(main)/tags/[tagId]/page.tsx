import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BillCard } from "@/features/bills/client/components/bill-list/bill-card";
import { getBillsByTag } from "@/features/bills/server/loaders/get-bills-by-tag";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ tagId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tagId } = await params;
  const billsByTag = await getBillsByTag(tagId);

  if (!billsByTag) {
    return { title: "タグが見つかりません" };
  }

  return {
    title: `${billsByTag.tag.label}の議案一覧 | みらい議会＠田川市`,
    description:
      billsByTag.tag.description ??
      `「${billsByTag.tag.label}」タグが付与された議案の一覧です。`,
  };
}

export default async function TagBillsPage({ params }: Props) {
  const { tagId } = await params;
  const billsByTag = await getBillsByTag(tagId);

  if (!billsByTag) {
    notFound();
  }

  const { tag, bills } = billsByTag;

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        {/* タグヘッダー */}
        <div className="flex flex-col gap-1.5 pb-8">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            {tag.label}の議案一覧
          </h1>
          {tag.description && (
            <p className="text-xs text-mirai-text-secondary">
              {tag.description}
            </p>
          )}
          <p className="text-xs text-mirai-text-secondary">{bills.length}件</p>
        </div>

        {/* 議案カード一覧 */}
        <div className="flex flex-col gap-4">
          {bills.map((bill) => (
            <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
              <BillCard bill={bill} />
            </Link>
          ))}
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[{ label: "TOP", href: routes.home() }, { label: tag.label }]}
        />
      </Container>
    </div>
  );
}
