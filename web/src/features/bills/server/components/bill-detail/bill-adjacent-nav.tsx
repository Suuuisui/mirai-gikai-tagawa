import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type { AdjacentSessionBill } from "../../loaders/get-adjacent-session-bills";

interface BillAdjacentNavProps {
  previous: AdjacentSessionBill | null;
  next: AdjacentSessionBill | null;
}

/**
 * 議案詳細ページの下部に表示する、同じ会期内の前後の議案への導線。
 * 並び順は会期まとめページの全議案リスト（status_order昇順→
 * submitted_date降順）と揃え、ユーザーのメンタルモデルを一致させる
 */
export function BillAdjacentNav({ previous, next }: BillAdjacentNavProps) {
  if (!previous && !next) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous && (
        <Link
          href={routes.billDetail(previous.id) as Route}
          className="group block"
        >
          <Card className="flex h-full items-center gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
            <ChevronLeft className="h-5 w-5 shrink-0 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-mirai-text-muted">
                前の議案
              </p>
              <p className="line-clamp-2 text-sm font-medium text-mirai-text">
                {previous.title}
              </p>
            </div>
          </Card>
        </Link>
      )}

      {next && (
        <Link
          href={routes.billDetail(next.id) as Route}
          className="group block sm:col-start-2"
        >
          <Card className="flex h-full items-center justify-end gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 text-right shadow-none transition-colors hover:bg-muted/50">
            <div className="min-w-0">
              <p className="text-xs font-medium text-mirai-text-muted">
                次の議案
              </p>
              <p className="line-clamp-2 text-sm font-medium text-mirai-text">
                {next.title}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5" />
          </Card>
        </Link>
      )}
    </div>
  );
}
