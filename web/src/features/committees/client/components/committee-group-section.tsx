import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { cn } from "@/lib/utils";
import {
  type CommitteeGroup,
  committeeGroupHref,
  committeeSectionId,
  formatPeriodLabel,
} from "../../shared/utils/committee-groups";
import { CommitteeMeetingRow } from "./committee-meeting-row";

interface CommitteeGroupSectionProps {
  group: CommitteeGroup;
}

/** カードに見せる会議数。これより多い委員会は、残りを委員会ごとのページへ送る */
const INITIAL_COUNT = 3;

/**
 * 委員会1つ分のカード。何を審議する場かの説明と開催期間を見せ、
 * 会議は新しい順に数件だけ載せる（一覧が縦に伸びすぎるのを防ぐ）。
 * 全件は委員会ごとのページ（サーバー側で描画）にあり、委員会名とボタンからたどれる
 */
export function CommitteeGroupSection({ group }: CommitteeGroupSectionProps) {
  const groupHref = committeeGroupHref(group.committeeName) as Route;
  const visibleMeetings = group.meetings.slice(0, INITIAL_COUNT);

  return (
    <section
      id={committeeSectionId(group.committeeName)}
      className={cn(
        jumpTargetClassName,
        "rounded-lg border border-mirai-border bg-white p-5"
      )}
    >
      <h2 className="text-lg font-bold text-mirai-text">
        <Link
          href={groupHref}
          className="underline decoration-mirai-text-placeholder underline-offset-4 transition-colors hover:decoration-primary"
        >
          {group.shortName}
        </Link>
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-mirai-text-secondary">
        {group.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-mirai-surface-key px-2.5 py-1 font-bold text-primary-accent">
          {group.meetings.length}回の記録
        </span>
        <span className="rounded-md bg-mirai-surface px-2.5 py-1 font-medium text-mirai-text-secondary">
          {formatPeriodLabel(group.period)}
        </span>
        {group.disclosureCount > 0 && (
          <SourceBadge
            kind="disclosure"
            detail={`開示文書 ${group.disclosureCount}件`}
            className="px-2.5 py-1"
          />
        )}
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-mirai-border-muted border-t border-mirai-border-muted">
        {visibleMeetings.map((meeting) => (
          <li key={meeting.id}>
            <CommitteeMeetingRow meeting={meeting} />
          </li>
        ))}
      </ul>

      {group.meetings.length > INITIAL_COUNT && (
        <div className="mt-3 flex justify-center">
          {/* 委員会名が長くても折り返して全文を見せる（ボタン既定の折り返し禁止を外す）。
              「（N回）」は途中で切れないよう、まとまりのまま次の行へ送る */}
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto min-h-10 w-full whitespace-normal py-2 text-center text-sm font-bold sm:w-auto"
          >
            <Link href={groupHref}>
              <span>
                {group.shortName}の記録をすべて見る
                <span className="whitespace-nowrap">
                  （{group.meetings.length}回）
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
