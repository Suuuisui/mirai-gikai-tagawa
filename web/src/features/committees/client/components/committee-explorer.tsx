"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  COMMITTEE_KIND_LABELS,
  type CommitteeKind,
} from "../../shared/data/committee-profiles";
import {
  countMeetingsByTopic,
  type CommitteeTopicId,
} from "../../shared/data/committee-topics";
import type { CommitteeMeetingListItem } from "../../shared/types";
import { buildCommitteeGroups } from "../../shared/utils/committee-groups";
import {
  filterByTopic,
  sortByDateDesc,
} from "../../shared/utils/committee-list";
import { CommitteeGroupSection } from "./committee-group-section";
import { CommitteeMeetingRow } from "./committee-meeting-row";

interface CommitteeExplorerProps {
  meetings: CommitteeMeetingListItem[];
}

/** 表示する種別の順番 */
const KIND_SECTIONS: CommitteeKind[] = ["standing", "special", "other"];

const KIND_DESCRIPTIONS: Record<CommitteeKind, string> = {
  standing:
    "分野ごとに常設されている委員会です。本会議で決める前に、議案をここで詳しく審査します。",
  special:
    "特定の問題を調べるために期間を決めて設置された委員会です。市政の疑惑を検証しています。",
  other: "議員全員が集まる会議や、市民向けの報告会の記録です。",
};

/** 直近の記録として先に見せる件数 */
const RECENT_COUNT = 6;

/**
 * 委員会記録の入口。
 *
 * 委員会名だけでは何の話か分からないため、まず暮らしのテーマ（お金・子育て・
 * ごみ…）で横断して選べるようにし、テーマ未選択のときは直近の記録と
 * 委員会別の一覧を見せる
 */
export function CommitteeExplorer({ meetings }: CommitteeExplorerProps) {
  const [activeTopic, setActiveTopic] = useState<CommitteeTopicId | null>(null);

  const topicCounts = useMemo(() => countMeetingsByTopic(meetings), [meetings]);
  const sorted = useMemo(() => sortByDateDesc(meetings), [meetings]);
  const filtered = useMemo(
    () => filterByTopic(sorted, activeTopic),
    [sorted, activeTopic]
  );
  const groups = useMemo(() => buildCommitteeGroups(meetings), [meetings]);

  const activeTopicEntry = topicCounts.find(
    (entry) => entry.topic.id === activeTopic
  );

  return (
    <div className="flex flex-col gap-10">
      {/* テーマで探す */}
      <section className="flex flex-col gap-3">
        <SectionHeading>気になるテーマから探す</SectionHeading>
        <p className="text-xs leading-relaxed text-mirai-text-muted">
          委員会の名前ではなく、暮らしのどの話かで記録をたどれます。
        </p>
        <div className="flex flex-wrap gap-2">
          {topicCounts.map(({ topic, count }) => {
            const isActive = topic.id === activeTopic;
            return (
              <Button
                key={topic.id}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTopic(isActive ? null : topic.id)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "h-10 text-[13px]"
                    : "h-10 border-mirai-border text-[13px] font-medium text-mirai-text-secondary"
                }
              >
                {topic.label}
                <span
                  className={
                    isActive ? "text-white/80" : "text-mirai-text-muted"
                  }
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      {activeTopicEntry ? (
        /* テーマで絞り込んだ結果 */
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeading>
              {activeTopicEntry.topic.label}の記録 {filtered.length}件
            </SectionHeading>
            <Button
              variant="outline"
              onClick={() => setActiveTopic(null)}
              className="h-9 gap-1 text-xs font-bold"
            >
              <X aria-hidden className="size-3.5" />
              絞り込みを解除
            </Button>
          </div>
          <p className="rounded-lg bg-mirai-surface-key-subtle px-4 py-3 text-sm leading-relaxed text-mirai-text-secondary">
            {activeTopicEntry.topic.description}
          </p>
          <ul className="flex flex-col divide-y divide-mirai-border-muted border-y border-mirai-border-muted">
            {filtered.map((meeting) => (
              <li key={meeting.id}>
                <CommitteeMeetingRow meeting={meeting} showCommitteeName />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {/* 直近の記録 */}
          <section className="flex flex-col gap-3">
            <SectionHeading>最近の会議</SectionHeading>
            <ul className="flex flex-col divide-y divide-mirai-border-muted border-y border-mirai-border-muted">
              {sorted.slice(0, RECENT_COUNT).map((meeting) => (
                <li key={meeting.id}>
                  <CommitteeMeetingRow meeting={meeting} showCommitteeName />
                </li>
              ))}
            </ul>
          </section>

          {/* 委員会別 */}
          {KIND_SECTIONS.map((kind) => {
            const kindGroups = groups.filter((group) => group.kind === kind);
            if (kindGroups.length === 0) return null;
            return (
              <section key={kind} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <SectionHeading>{COMMITTEE_KIND_LABELS[kind]}</SectionHeading>
                  <p className="text-xs leading-relaxed text-mirai-text-muted">
                    {KIND_DESCRIPTIONS[kind]}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  {kindGroups.map((group) => (
                    <CommitteeGroupSection
                      key={group.committeeName}
                      group={group}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
