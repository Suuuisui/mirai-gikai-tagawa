import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";

type CurrentDietSessionProps = {
  session: DietSession | null;
};

export function CurrentDietSession({ session }: CurrentDietSessionProps) {
  return (
    <div className="w-full bg-mirai-surface-warm px-6 py-6">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-xl font-bold text-gray-800 leading-[0.9]">
            本日は
          </h2>
          <div
            className={`
            inline-flex items-center justify-center px-5 py-1.5 rounded-[50px]  shrink-0
            ${session == null ? "bg-mirai-border-muted" : "bg-mirai-gradient"}
            `}
          >
            <span className="text-base font-bold leading-[1.48]">
              {session == null ? "田川市議会閉会中" : "田川市議会会期中"}
            </span>
          </div>
        </div>
        {session != null && (
          <div className="text-sm leading-[1.5] shrink-0">
            <div>{session.name}</div>
            <div>{formatDateWithDots(session.start_date)}〜</div>
          </div>
        )}
      </div>
      <Link
        href={routes.sessionArchive()}
        className="group mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-primary-accent w-fit"
      >
        これまでの議会ごとのまとめを見る
        <ChevronRight className="h-4 w-4 text-primary-accent group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
