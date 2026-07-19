import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { AdjacentSessions } from "../../../shared/utils/session-summary";

interface SessionNavProps {
  adjacent: AdjacentSessions;
}

/**
 * 会期まとめページ下部のナビゲーション。
 * start_date順で隣接する会期のまとめページへのリンク（存在する場合のみ）に加え、
 * 常に会期一覧ページ（/sessions）へのリンクを表示する
 */
export function SessionNav({ adjacent }: SessionNavProps) {
  const { previous, next } = adjacent;
  const hasAdjacent = previous !== null || next !== null;

  return (
    <nav className="flex flex-col gap-4 border-t border-mirai-border pt-6 text-sm font-medium text-mirai-text">
      {hasAdjacent && (
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      )}
      <Link
        href={routes.sessionArchive() as Route}
        className="inline-flex items-center justify-center gap-1 text-primary-accent hover:underline"
      >
        会期一覧へ
      </Link>
    </nav>
  );
}
