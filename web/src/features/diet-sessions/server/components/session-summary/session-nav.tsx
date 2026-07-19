import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { AdjacentSessions } from "../../../shared/utils/session-summary";

interface SessionNavProps {
  adjacent: AdjacentSessions;
}

/**
 * 「前後の会期ナビ」。start_date順で隣接する会期のまとめページへのリンクを表示する
 */
export function SessionNav({ adjacent }: SessionNavProps) {
  const { previous, next } = adjacent;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav className="grid grid-cols-2 gap-3 border-t border-mirai-border pt-6 text-sm font-medium text-mirai-text">
      <div className="justify-self-start">
        {previous && (
          <Link
            href={routes.sessionSummary(previous.id) as Route}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ChevronLeft className="size-4 shrink-0" />
            前の会期（{previous.name}）
          </Link>
        )}
      </div>
      <div className="justify-self-end text-right">
        {next && (
          <Link
            href={routes.sessionSummary(next.id) as Route}
            className="inline-flex items-center gap-1 hover:underline"
          >
            次の会期（{next.name}）
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </nav>
  );
}
