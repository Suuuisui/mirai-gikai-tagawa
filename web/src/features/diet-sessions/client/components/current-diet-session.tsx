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
    <div className="w-full bg-mirai-surface px-6 py-6 md:mt-2 md:rounded-lg">
      {/*
        スマホ幅では「本日は＋バッジ」と会期名を縦に積む。
        横並びのまま折返しに任せると「本日は」が1文字ずつ改行し、
        会期名がバッジに重なって表示されていた
      */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-5">
        <div className="flex items-center gap-4">
          <h2 className="shrink-0 whitespace-nowrap text-xl font-bold text-mirai-text">
            本日は
          </h2>
          <div
            className={`
            inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-5 py-1.5
            ${session == null ? "bg-mirai-surface-muted" : "bg-mirai-surface-key"}
            `}
          >
            <span className="text-base font-bold leading-[1.48]">
              {session == null ? "田川市議会閉会中" : "田川市議会会期中"}
            </span>
          </div>
        </div>
        {session != null && (
          <div className="text-sm leading-[1.5]">
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
