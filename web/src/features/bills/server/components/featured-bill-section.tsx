import type { Route } from "next";
import Link from "next/link";
import { TOP_SECTION_IDS } from "@/components/top/section-jump-nav";
import { routes } from "@/lib/routes";
import { BillCard } from "../../client/components/bill-list/bill-card";
import type { BillWithContent } from "../../shared/types";

interface FeaturedBillSectionProps {
  bills: BillWithContent[];
}

export function FeaturedBillSection({ bills }: FeaturedBillSectionProps) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <section
      id={TOP_SECTION_IDS.featured}
      className="flex flex-col gap-6 scroll-mt-36"
    >
      {/* セクションヘッダー */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
          注目の議案<span aria-hidden="true">🔥</span>
        </h2>
        <p className="text-xs font-medium text-mirai-text-secondary leading-[1.67]">
          田川市議会に提出された注目議案
        </p>
      </div>

      {/* 注目の議案カード */}
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
    </section>
  );
}
