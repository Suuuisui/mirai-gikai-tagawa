import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatDateWithDots } from "@/lib/utils/date";
import { routes } from "@/lib/routes";
import type { DietSession } from "../../shared/types";

interface DietSessionCardProps {
  session: DietSession;
  billCount: number;
}

/**
 * 会期一覧ページで使用する、会期のサマリーカード
 */
export function DietSessionCard({ session, billCount }: DietSessionCardProps) {
  if (!session.slug) {
    return null;
  }

  const sessionBillsUrl = routes.kokkaiSessionBills(session.slug);

  return (
    <Link href={sessionBillsUrl as Route} className="group block">
      <Card className="border-[0.5px] border-mirai-text-placeholder rounded-2xl shadow-none hover:bg-muted/50 transition-colors p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-bold text-[15px] leading-[1.6] truncate">
              {session.name}
            </h3>
            <p className="text-xs text-mirai-text-muted">
              {formatDateWithDots(session.start_date)} 〜{" "}
              {formatDateWithDots(session.end_date)}
              <span className="ml-2 text-primary-accent font-bold">
                {billCount}件
              </span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Card>
    </Link>
  );
}
