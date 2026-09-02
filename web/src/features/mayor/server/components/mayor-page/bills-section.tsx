import { CalendarClock, FileText } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShowMoreList } from "@/components/ui/show-more-list";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import type { BillWithContentLite } from "@/features/bills/shared/types";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { MayorActivity } from "../../loaders/get-mayor-activity";
import { SourceLink } from "./source-link";

interface BillsSectionProps {
  bills: BillWithContentLite[];
  upcoming: MayorActivity["upcoming"];
}

/** 就任後の市長提出議案。まだ無ければ次の定例会の予告を出す */
export function BillsSection({ bills, upcoming }: BillsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>市長が提出した議案</SectionHeading>
      <BillsBody bills={bills} upcoming={upcoming} />
      <Link
        href={routes.proposerBills("mayor") as Route}
        className="inline-flex w-fit items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <FileText aria-hidden className="size-4" />
        これまでの市長提出議案をすべて見る
      </Link>
    </section>
  );
}

/** 議案あり／予告あり／どちらも無し の3状態を出し分ける */
function BillsBody({ bills, upcoming }: BillsSectionProps) {
  if (bills.length > 0) {
    return <BillsList bills={bills} />;
  }
  if (upcoming) {
    return <UpcomingNotice upcoming={upcoming} />;
  }
  return (
    <p className="rounded-lg bg-mirai-surface px-4 py-5 text-sm text-mirai-text-secondary">
      就任後の市長提出議案はまだ公開されていません。
    </p>
  );
}

function BillsList({ bills }: { bills: BillWithContentLite[] }) {
  return (
    <ShowMoreList initialCount={10} className="flex flex-col gap-3">
      {bills.map((bill) => (
        <Link
          key={bill.id}
          href={routes.billDetail(bill.id) as Route}
          aria-label={bill.bill_content?.title || bill.name}
        >
          <CompactBillCard bill={bill} />
        </Link>
      ))}
    </ShowMoreList>
  );
}

function UpcomingNotice({
  upcoming,
}: {
  upcoming: NonNullable<MayorActivity["upcoming"]>;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-mirai-surface-key-subtle px-4 py-5">
      <CalendarClock
        aria-hidden
        className="mt-0.5 size-5 shrink-0 text-primary-accent"
      />
      <div className="text-sm leading-relaxed text-mirai-text-secondary">
        <p className="font-bold text-mirai-text">
          {upcoming.name}（{formatDateWithDots(upcoming.startDate)}〜
          {formatDateWithDots(upcoming.endDate)}）で{upcoming.billCount}
          件の議案が提出される予定です
        </p>
        <p className="mt-1">
          就任後の市長提出議案は、公開され次第ここに表示します。
          {upcoming.link && (
            <>
              {" "}
              予定の出典: <SourceLink link={upcoming.link} />
            </>
          )}
        </p>
      </div>
    </div>
  );
}
