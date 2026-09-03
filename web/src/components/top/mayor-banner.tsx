import { ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";
import {
  MAYOR_ACTIONS,
  MAYOR_PROFILE,
} from "@/features/mayor/shared/data/mayor-profile";
import {
  compactName,
  daysSinceInauguration,
  newestFirst,
} from "@/features/mayor/shared/utils/mayor-activity";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";

interface MayorBannerProps {
  /** JST基準の現在時刻（就任日数の表示に使う） */
  now: Date;
}

/**
 * トップページから新市長の特設ページへ誘導するバナー。
 * 市長交代で関心が高いため、会期バナーの直下に置き、最新の動きを一行で見せる
 */
export function MayorBanner({ now }: MayorBannerProps) {
  const days = daysSinceInauguration(MAYOR_PROFILE.inaugurationDate, now);
  // MAYOR_ACTIONS は就任の項目を必ず含む（mayor-profile.test.ts で担保）
  const latest = newestFirst(MAYOR_ACTIONS)[0];

  return (
    <Link
      href={routes.mayor()}
      className="group block w-full bg-mirai-surface-key px-6 py-5 transition-colors hover:bg-mirai-surface-key-subtle md:mt-2 md:rounded-lg"
    >
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
          <UserCheck aria-hidden className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-xs font-bold text-primary-accent">
            新市長の動きを追う
            {days > 0 && (
              <span className="ml-2 font-medium text-mirai-text-secondary">
                就任{days}日目
              </span>
            )}
          </p>
          <p className="text-base font-bold leading-snug text-mirai-text">
            {compactName(MAYOR_PROFILE.name)}市長は議会で何をしているか
          </p>
          <p className="text-xs leading-relaxed text-mirai-text-secondary">
            最新: {latest.title}（{formatDateWithDots(latest.date)}）
          </p>
        </div>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-primary-accent transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
