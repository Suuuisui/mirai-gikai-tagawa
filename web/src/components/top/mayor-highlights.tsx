import { ChevronRight, UserCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  MAYOR_ACTIONS,
  MAYOR_PROFILE,
} from "@/features/mayor/shared/data/mayor-profile";
import { MAYOR_SECTIONS } from "@/features/mayor/shared/data/section-ids";
import {
  compactName,
  daysSinceInauguration,
  newestFirst,
} from "@/features/mayor/shared/utils/mayor-activity";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";

/** トップページに見出しを出す「市長の動き」の件数（新しい順） */
const LATEST_ACTION_COUNT = 3;

interface MayorHighlightsProps {
  /** JST基準の現在時刻（就任日数の表示に使う） */
  now: Date;
}

/**
 * トップページで、市長が代わってからの動きを新しい順に見せるブロック。
 * 市長交代で関心が高いため、閉会中はページの先頭（ヒーロー直下）に置く。
 * リンクは末尾の「すべて見る」1つだけにし、その押せる範囲をブロック全体に
 * 広げている（ブロックごとリンクで包むと、リンクの読み上げが全文になるため）
 */
export function MayorHighlights({ now }: MayorHighlightsProps) {
  const days = daysSinceInauguration(MAYOR_PROFILE.inaugurationDate, now);
  // MAYOR_ACTIONS は就任の項目を必ず含む（mayor-profile.test.ts で担保）
  const latestActions = newestFirst(MAYOR_ACTIONS).slice(
    0,
    LATEST_ACTION_COUNT
  );

  return (
    <section className="group relative w-full bg-mirai-surface-key px-6 py-6 transition-colors hover:bg-mirai-surface-key-subtle md:mt-2 md:rounded-lg">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
          <UserCheck aria-hidden className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-xs font-bold text-primary-accent">
            市長が代わってからの動き
            {days > 0 && (
              <span className="ml-2 font-medium text-mirai-text-secondary">
                就任{days}日目
              </span>
            )}
          </p>
          {/* 文節単位のinline-blockで、スマホ幅でも語の途中で折り返さないようにする */}
          <h2 className="text-lg font-bold leading-snug text-mirai-text">
            <span className="inline-block">
              {compactName(MAYOR_PROFILE.name)}市長は
            </span>
            <span className="inline-block">議会で何をしているか</span>
          </h2>
        </div>
      </div>

      <ol className="mt-4 flex flex-col divide-y divide-mirai-border-muted rounded-lg bg-white px-4">
        {latestActions.map((action, index) => (
          <li
            key={`${action.date}-${action.title}`}
            className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="flex shrink-0 items-center gap-2 sm:w-32">
              <time
                dateTime={action.date}
                className="text-xs font-bold text-primary-accent"
              >
                {formatDateWithDots(action.date)}
              </time>
              {index === 0 && <Badge className="text-[11px]">最新</Badge>}
            </span>
            <span className="text-[15px] font-bold leading-relaxed text-mirai-text">
              {action.title}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 flex justify-end">
        <Link
          href={`${routes.mayor()}#${MAYOR_SECTIONS.actions.id}` as Route}
          className="flex items-center gap-0.5 text-sm font-bold text-primary after:absolute after:inset-0 after:content-['']"
        >
          就任後の動きをすべて見る（{MAYOR_ACTIONS.length}件）
          <ChevronRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </p>
    </section>
  );
}
