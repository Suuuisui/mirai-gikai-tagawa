import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";

type CurrentDietSessionProps = {
  session: DietSession | null;
  /** 開催中の会期に一般質問の通告があるとき、その人数と会期キー（0人なら出さない） */
  questions?: { count: number; sessionKey: string } | null;
  /**
   * 閉会中に案内する、直近で閉会した会期。閉会中は「いま何も動いていない」と
   * 読めてしまうため、終わったばかりの会期のまとめへ直接たどれるようにする
   */
  latestSession?: {
    session: DietSession;
    /** その会期の一般質問の人数（0人なら出さない） */
    questionCount: number;
  } | null;
};

function SessionLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit items-center gap-0.5 text-xs font-bold text-primary-accent"
    >
      {children}
      <ChevronRight className="h-4 w-4 text-primary-accent transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function CurrentDietSession({
  session,
  questions = null,
  latestSession = null,
}: CurrentDietSessionProps) {
  // 閉会中だけ、直近で閉会した会期を案内する
  const latest = session == null ? latestSession : null;

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
        {latest != null && (
          <div className="text-sm leading-[1.5]">
            <div>
              <span className="mr-2 text-xs font-bold text-mirai-text-muted">
                直近の議会
              </span>
              {latest.session.name}
            </div>
            <div>
              {formatDateWithDots(latest.session.start_date)}〜
              {formatDateWithDots(latest.session.end_date)}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5">
        {questions && questions.count > 0 && (
          <SessionLink
            href={routes.questionSession(questions.sessionKey) as Route}
          >
            この会期の一般質問（{questions.count}人）を見る
          </SessionLink>
        )}
        {latest != null && (
          <SessionLink href={routes.sessionSummary(latest.session.id) as Route}>
            この会期のまとめを見る
          </SessionLink>
        )}
        {latest?.session.slug && latest.questionCount > 0 && (
          <SessionLink
            href={routes.questionSession(latest.session.slug) as Route}
          >
            一般質問（{latest.questionCount}人）を見る
          </SessionLink>
        )}
        <SessionLink href={routes.committees()}>
          委員会・本会議の記録を見る
        </SessionLink>
        {latest == null && (
          <SessionLink href={routes.sessionArchive()}>
            これまでの議会ごとのまとめを見る
          </SessionLink>
        )}
      </div>
    </div>
  );
}
