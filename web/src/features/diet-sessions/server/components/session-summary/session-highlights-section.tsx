import type { Route } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { BillCard } from "@/features/bills/client/components/bill-list/bill-card";
import type { BillWithContent } from "@/features/bills/shared/types";
import { routes } from "@/lib/routes";

interface SessionHighlightsSectionProps {
  bills: BillWithContent[];
}

/**
 * 「この会期のハイライト」セクション。興味度スコア上位の議案を
 * 既存の BillCard で表示する
 */
export function SessionHighlightsSection({
  bills,
}: SessionHighlightsSectionProps) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>この会期のハイライト</SectionHeading>
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
