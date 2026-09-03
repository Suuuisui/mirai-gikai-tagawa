import { CalendarClock, FileText } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShowMoreList } from "@/components/ui/show-more-list";
import { TextLink } from "@/components/ui/text-link";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import type { BillWithContentLite } from "@/features/bills/shared/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import type { UpcomingSessionView } from "../../loaders/get-mayor-activity";
import { MAYOR_SECTIONS } from "./section-ids";
import { SourceLink } from "./source-link";

interface UpcomingSectionProps {
  bills: BillWithContentLite[];
  upcoming: UpcomingSessionView | null;
}

/** 次の定例会の予告と、就任後に市長が提出した議案 */
export function UpcomingSection({ bills, upcoming }: UpcomingSectionProps) {
  return (
    <section
      id={MAYOR_SECTIONS.upcoming.id}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>これからの予定と提出議案</SectionHeading>
      {upcoming && <UpcomingSessionCard upcoming={upcoming} />}
      {bills.length > 0 ? (
        <>
          <h3 className="text-sm font-bold text-mirai-text">
            就任後に市長が提出した議案
          </h3>
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
        </>
      ) : (
        <p className="text-sm leading-relaxed text-mirai-text-secondary">
          就任後に市長が提出した議案は、議会の記録が公開され次第ここに並びます。
        </p>
      )}
      <TextLink
        href={routes.proposerBills("mayor") as Route}
        className="text-sm"
      >
        <FileText aria-hidden className="size-4" />
        市長提出議案の一覧を見る（前市長の分も含む）
      </TextLink>
    </section>
  );
}

/** 定例会の名前・段階（あとN日／会期中）・見どころ・出典 */
function UpcomingSessionCard({ upcoming }: { upcoming: UpcomingSessionView }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-mirai-surface-key-subtle px-4 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock aria-hidden className="size-5 text-primary-accent" />
        <p className="text-base font-bold text-mirai-text">{upcoming.name}</p>
        <Badge className="bg-primary text-white">{upcoming.timingLabel}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-mirai-text-secondary">
        {upcoming.note}。会期は{formatDateWithDots(upcoming.startDate)}〜
        {formatDateWithDots(upcoming.endDate)}で、{upcoming.billCount}
        件の議案が提出される予定です。
      </p>
      <ul className="flex flex-col gap-1.5 border-l-2 border-mirai-border-muted pl-3">
        {upcoming.highlights.map((highlight) => (
          <li
            key={highlight}
            className="text-sm leading-relaxed text-mirai-text-secondary"
          >
            {highlight}
          </li>
        ))}
      </ul>
      {upcoming.link && (
        <p className="text-xs text-mirai-text-muted">
          出典: <SourceLink link={upcoming.link} />
        </p>
      )}
    </div>
  );
}
