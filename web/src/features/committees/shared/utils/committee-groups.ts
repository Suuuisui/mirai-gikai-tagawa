import {
  type CommitteeKind,
  getCommitteeProfile,
} from "../data/committee-profiles";
import type { CommitteeMeetingListItem } from "../types";

/** 一覧に表示する委員会ごとのまとまり */
export interface CommitteeGroup {
  committeeName: string;
  shortName: string;
  kind: CommitteeKind;
  description: string;
  meetings: CommitteeMeetingListItem[];
  /** 開催期間（meeting_date の最古〜最新。1回のみなら同じ日付） */
  period: { from: string; to: string };
  /** 情報開示請求で入手した文書に基づく会議の数 */
  disclosureCount: number;
}

/** 種別の表示順（常任→特別→その他） */
const KIND_ORDER: Record<CommitteeKind, number> = {
  standing: 0,
  special: 1,
  other: 2,
};

/**
 * 会議一覧を委員会ごとにまとめ、種別→会議数の多い順に並べる。
 * 各グループ内の会議は開催日の降順（新しい順）を保つ
 */
export function buildCommitteeGroups(
  meetings: readonly CommitteeMeetingListItem[]
): CommitteeGroup[] {
  const byCommittee = new Map<string, CommitteeMeetingListItem[]>();
  for (const meeting of meetings) {
    const list = byCommittee.get(meeting.committee_name);
    if (list) {
      list.push(meeting);
    } else {
      byCommittee.set(meeting.committee_name, [meeting]);
    }
  }

  const groups: CommitteeGroup[] = Array.from(byCommittee.entries()).map(
    ([committeeName, items]) => {
      const sorted = [...items].sort((a, b) =>
        b.meeting_date.localeCompare(a.meeting_date)
      );
      const profile = getCommitteeProfile(committeeName);
      return {
        committeeName,
        shortName: profile.shortName || committeeName,
        kind: profile.kind,
        description: profile.description,
        meetings: sorted,
        period: {
          from: sorted[sorted.length - 1].meeting_date,
          to: sorted[0].meeting_date,
        },
        disclosureCount: sorted.filter((m) => m.source_type === "disclosure")
          .length,
      };
    }
  );

  return groups.sort((a, b) => {
    const kindDiff = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kindDiff !== 0) return kindDiff;
    const countDiff = b.meetings.length - a.meetings.length;
    if (countDiff !== 0) return countDiff;
    return a.committeeName.localeCompare(b.committeeName, "ja");
  });
}

/** 「2021年〜2026年」のような開催期間の表示文字列を作る */
export function formatPeriodLabel(period: {
  from: string;
  to: string;
}): string {
  const fromYear = period.from.slice(0, 4);
  const toYear = period.to.slice(0, 4);
  return fromYear === toYear ? `${fromYear}年` : `${fromYear}〜${toYear}年`;
}
