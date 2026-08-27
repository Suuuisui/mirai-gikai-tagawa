"use client";

import { ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import type { BillWithContent } from "@/features/bills/shared/types";
import { getCardStatusLabel } from "@/features/bills/shared/utils/bill-status";
import { routes } from "@/lib/routes";
import { groupSimilarBills } from "../../shared/utils/group-similar-bills";

type FilterType = "all" | "enacted" | "rejected" | "other";

type Props = {
  bills: BillWithContent[];
};

function getFilterCounts(bills: BillWithContent[]) {
  const enacted = bills.filter((b) => b.status === "enacted").length;
  const rejected = bills.filter((b) => b.status === "rejected").length;
  const other = bills.length - enacted - rejected;

  return { all: bills.length, enacted, rejected, other };
}

function filterBills(
  bills: BillWithContent[],
  filter: FilterType
): BillWithContent[] {
  switch (filter) {
    case "enacted":
      return bills.filter((b) => b.status === "enacted");
    case "rejected":
      return bills.filter((b) => b.status === "rejected");
    case "other":
      return bills.filter(
        (b) => b.status !== "enacted" && b.status !== "rejected"
      );
    default:
      return bills;
  }
}

/**
 * ステータスの内訳ラベル（例:「可決11・否決1」）。
 * グループに否決等が含まれることが折りたたみ中でも分かるようにする
 */
function summarizeGroupStatuses(bills: BillWithContent[]): string {
  const counts = new Map<string, number>();
  for (const bill of bills) {
    const label = getCardStatusLabel(bill.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => `${label}${count}`)
    .join("・");
}

/** 同型議案グループ（人事案件等）の折りたたみ表示 */
function BillGroupCollapsible({
  baseTitle,
  bills,
}: {
  baseTitle: string;
  bills: BillWithContent[];
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="group h-auto w-full justify-between gap-3 whitespace-normal border border-mirai-border bg-white p-4 text-left hover:bg-muted/50"
        >
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-bold leading-[1.6] text-mirai-text">
              {baseTitle}
            </span>
            <span className="text-xs font-medium text-mirai-text-muted">
              同種の議案{bills.length}件（{summarizeGroupStatuses(bills)}）
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-mirai-text-muted transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 flex flex-col gap-3 border-l-2 border-mirai-border pl-3">
          {bills.map((bill) => (
            <Link
              key={bill.id}
              href={routes.billDetail(bill.id) as Route}
              aria-label={bill.bill_content?.title || bill.name}
            >
              <CompactBillCard bill={bill} />
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BillListWithStatusFilter({ bills }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const counts = getFilterCounts(bills);
  const filteredBills = filterBills(bills, activeFilter);
  // 同型の人事案件等が十数枚連続してリストを埋めないよう、連続する
  // 同型議案は折りたたみグループに集約する
  const listItems = groupSimilarBills(filteredBills);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "ALL", count: counts.all },
    { key: "enacted", label: "可決", count: counts.enacted },
    { key: "rejected", label: "否決", count: counts.rejected },
    { key: "other", label: "その他", count: counts.other },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* フィルターボタン */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant="ghost"
            onClick={() => setActiveFilter(filter.key)}
            className={`h-[29px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              activeFilter === filter.key
                ? "bg-mirai-surface-key text-primary-accent"
                : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
            }`}
          >
            {filter.label} {filter.count}
          </Button>
        ))}
      </div>

      {/* 議案リスト */}
      {filteredBills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          該当する議案がありません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listItems.map((item) =>
            item.type === "group" ? (
              <BillGroupCollapsible
                key={item.bills[0].id}
                baseTitle={item.baseTitle}
                bills={item.bills}
              />
            ) : (
              <Link
                key={item.bill.id}
                href={routes.billDetail(item.bill.id) as Route}
                aria-label={item.bill.bill_content?.title || item.bill.name}
              >
                <CompactBillCard bill={item.bill} />
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
