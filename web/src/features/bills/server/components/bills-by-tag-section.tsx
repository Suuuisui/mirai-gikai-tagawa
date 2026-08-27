import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { tagSectionId } from "@/components/top/section-jump-nav";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { BillCard } from "../../client/components/bill-list/bill-card";
import type { BillsByTag } from "../../shared/types";

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
}

export function BillsByTagSection({ billsByTag }: BillsByTagSectionProps) {
  if (billsByTag.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {billsByTag.map(({ tag, bills }) => (
        <section
          key={tag.id}
          id={tagSectionId(tag.label)}
          className="flex flex-col gap-6 scroll-mt-36"
        >
          {/* タグヘッダー */}
          <div className="flex flex-col gap-1.5">
            <SectionHeading>{tag.label}</SectionHeading>
            {tag.description && (
              <p className="text-xs text-mirai-text-muted">{tag.description}</p>
            )}
          </div>

          {/* 議案カード一覧 */}
          <div className="flex flex-col gap-4">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={routes.billDetail(bill.id) as Route}
                aria-label={bill.bill_content?.title || bill.name}
              >
                <BillCard bill={bill} />
              </Link>
            ))}
          </div>

          {/* すべて見る導線 */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 w-full gap-2.5 text-[15px] font-medium"
            >
              <Link href={routes.tagBills(tag.id) as Route}>
                {tag.label}の議案をすべて見る
                <ChevronRight className="size-[15px] shrink-0" />
              </Link>
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
