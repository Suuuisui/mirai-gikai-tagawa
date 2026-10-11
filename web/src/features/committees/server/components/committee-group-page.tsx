import "server-only";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JumpNav, jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { SOURCE_KIND_ORDER } from "@/features/sources/shared/data/source-kinds";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CommitteeMeetingRow } from "../../client/components/committee-meeting-row";
import { COMMITTEE_KIND_LABELS } from "../../shared/data/committee-profiles";
import {
  COMMITTEE_KIND_ORDER,
  type CommitteeGroup,
  committeeGroupHref,
  formatPeriodLabel,
} from "../../shared/utils/committee-groups";
import {
  countMeetingsBySourceKind,
  SOURCE_COUNT_LABELS,
} from "../../shared/utils/committee-source";
import {
  formatYearHeading,
  formatYearJumpLabel,
  groupMeetingsByYear,
  yearSectionId,
} from "../../shared/utils/group-meetings-by-year";
import { CommitteeSourceNote } from "./committee-source-note";

interface CommitteeGroupPageProps {
  /** 表示する委員会 */
  group: CommitteeGroup;
  /** ほかの委員会・会議（種別→会議数の順） */
  otherGroups: readonly CommitteeGroup[];
}

/**
 * 委員会ごとの記録ページ（/committees/group/[slug]）。
 * その委員会の全会議を年ごとにサーバー側で描画し、すべての会議ページへのリンクを
 * HTML に出す（一覧ページは最新の数件だけを見せているため）
 */
export function CommitteeGroupPage({
  group,
  otherGroups,
}: CommitteeGroupPageProps) {
  const years = groupMeetingsByYear(group.meetings);
  const sourceCounts = countMeetingsBySourceKind(group.meetings);

  return (
    <div data-wide-column>
      {/* ページタイトル（キーカラーの薄い色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <p className="text-sm font-bold text-primary-accent">
            {COMMITTEE_KIND_LABELS[group.kind]}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold leading-relaxed text-mirai-text">
            {group.shortName}の記録
          </h1>
          {group.committeeName !== group.shortName && (
            <p className="mt-1 text-xs leading-relaxed text-mirai-text-muted">
              正式名称: {group.committeeName}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            {group.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              {group.meetings.length}回の記録
            </span>
            <span className="rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              {formatPeriodLabel(group.period)}
            </span>
            {SOURCE_KIND_ORDER.filter((kind) => sourceCounts[kind] > 0).map(
              (kind) => (
                <SourceBadge
                  key={kind}
                  kind={kind}
                  detail={`${SOURCE_COUNT_LABELS[kind]} ${sourceCounts[kind]}回`}
                  className="px-3 py-1.5"
                />
              )
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-10">
          {/* 年のジャンプナビ（1年分しか無いときは要らない） */}
          {years.length > 1 && (
            <JumpNav
              entries={years.map((yearGroup) => ({
                label: formatYearJumpLabel(yearGroup),
                href: `#${yearSectionId(yearGroup.year)}`,
              }))}
            />
          )}

          {/* 年ごとの会議（新しい年から。全件をサーバー側で描画する） */}
          {years.map((yearGroup) => (
            <section
              key={yearGroup.year}
              id={yearSectionId(yearGroup.year)}
              className={cn(jumpTargetClassName, "flex flex-col gap-3")}
            >
              <SectionHeading>{formatYearHeading(yearGroup)}</SectionHeading>
              <ul className="flex flex-col divide-y divide-mirai-border-muted border-y border-mirai-border-muted">
                {yearGroup.meetings.map((meeting) => (
                  <li key={meeting.id}>
                    <CommitteeMeetingRow meeting={meeting} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="flex flex-col gap-6">
            {otherGroups.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeading>ほかの委員会・会議の記録</SectionHeading>
                {COMMITTEE_KIND_ORDER.map((kind) => {
                  const kindGroups = otherGroups.filter(
                    (other) => other.kind === kind
                  );
                  if (kindGroups.length === 0) return null;
                  return (
                    <div key={kind} className="flex flex-col gap-2">
                      <h3 className="text-sm font-bold text-mirai-text-secondary">
                        {COMMITTEE_KIND_LABELS[kind]}
                      </h3>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {kindGroups.map((other) => (
                          <li key={other.committeeName}>
                            <OtherCommitteeLink group={other} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            )}

            <TextLink href={routes.committees()} className="text-sm">
              委員会の記録の一覧へ
              <ChevronRight aria-hidden className="size-4" />
            </TextLink>
          </div>

          {/* 出典・注意書き */}
          <CommitteeSourceNote />
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "委員会の記録", href: routes.committees() },
            { label: group.shortName },
          ]}
        />
      </Container>
    </div>
  );
}

/** ほかの委員会の記録ページへのリンク。委員会名は折り返して全文を見せる */
function OtherCommitteeLink({ group }: { group: CommitteeGroup }) {
  return (
    <Link
      href={committeeGroupHref(group.committeeName) as Route}
      className="flex h-full items-start justify-between gap-3 rounded-lg border border-mirai-border bg-white px-4 py-3 transition-colors hover:bg-mirai-surface-key-subtle"
    >
      <span className="text-sm font-bold leading-relaxed text-mirai-text">
        {group.shortName}
      </span>
      <span className="shrink-0 text-xs font-medium leading-relaxed text-mirai-text-muted">
        {group.meetings.length}回
      </span>
    </Link>
  );
}
