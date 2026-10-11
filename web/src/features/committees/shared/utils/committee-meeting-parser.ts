import type { CommitteeMeetingSummary } from "../types";

/** jsonbカラムの値を文字列配列として安全に解釈する（不正値は空配列） */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * 会議録一覧を委員会名ごとにグループ化する（配列の出現順を保持し、
 * グループ内は開催日の降順を前提とする）
 */
export function groupMeetingsByCommittee<
  T extends Pick<CommitteeMeetingSummary, "committee_name">,
>(meetings: T[]): Array<{ committeeName: string; meetings: T[] }> {
  const groups = new Map<string, T[]>();
  for (const meeting of meetings) {
    const list = groups.get(meeting.committee_name);
    if (list) {
      list.push(meeting);
    } else {
      groups.set(meeting.committee_name, [meeting]);
    }
  }
  return Array.from(groups.entries()).map(([committeeName, items]) => ({
    committeeName,
    meetings: items,
  }));
}
