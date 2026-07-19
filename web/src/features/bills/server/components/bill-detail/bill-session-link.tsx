import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";

interface BillSessionLinkProps {
  sessionId: string;
  sessionName: string;
}

/**
 * 議案詳細ページから、その議案が審議された会期のまとめページ（/sessions/[id]）
 * への導線。611件ある議案それぞれから会期まとめページに到達できるようにする
 */
export function BillSessionLink({
  sessionId,
  sessionName,
}: BillSessionLinkProps) {
  return (
    <Link
      href={routes.sessionSummary(sessionId) as Route}
      className="group block"
    >
      <Card className="flex items-center justify-between gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
        <p className="text-sm font-medium text-mirai-text">
          📋 この議案が審議された会期：
          <span className="font-bold text-primary-accent">{sessionName}</span>
          のまとめを見る
        </p>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
