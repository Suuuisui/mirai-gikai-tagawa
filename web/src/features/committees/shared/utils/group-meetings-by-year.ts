import { formatJapaneseEraDate } from "@/lib/utils/japanese-era";
import type { CommitteeMeetingListItem } from "../types";

/** 委員会ごとのページで、1年分の会議のまとまり */
export interface MeetingYearGroup {
  /** 西暦の年（"2026"） */
  year: string;
  /**
   * 和暦の年（"令和8年"）。年の途中で元号が変わった年は新しい方から並べる
   * （"令和元年・平成31年"）。和暦にできない日付だけの年は null
   */
  eraLabel: string | null;
  /** その年に開かれた会議（開催日の新しい順） */
  meetings: CommitteeMeetingListItem[];
}

/** "令和8年10月8日" の先頭にある年の部分（"令和8年"）。和暦にできなければ null */
function eraYearOf(meetingDate: string): string | null {
  return formatJapaneseEraDate(meetingDate)?.match(/^.+?年/)?.[0] ?? null;
}

/**
 * 会議を開催年（西暦）ごとにまとめる。年は新しい順、年の中は開催日の新しい順。
 * 同じ日に複数あるときは id 順にして、取得のたびに並びが入れ替わらないようにする
 */
export function groupMeetingsByYear(
  meetings: readonly CommitteeMeetingListItem[]
): MeetingYearGroup[] {
  const sorted = [...meetings].sort(
    (a, b) =>
      b.meeting_date.localeCompare(a.meeting_date) || a.id.localeCompare(b.id)
  );

  // 新しい順に見ていくので、Map の並びも年の新しい順になる
  const byYear = new Map<
    string,
    { eraYears: string[]; meetings: CommitteeMeetingListItem[] }
  >();
  for (const meeting of sorted) {
    const year = meeting.meeting_date.slice(0, 4);
    const entry = byYear.get(year) ?? { eraYears: [], meetings: [] };
    entry.meetings.push(meeting);
    const eraYear = eraYearOf(meeting.meeting_date);
    if (eraYear && !entry.eraYears.includes(eraYear)) {
      entry.eraYears.push(eraYear);
    }
    byYear.set(year, entry);
  }

  return Array.from(byYear, ([year, { eraYears, meetings: inYear }]) => ({
    year,
    eraLabel: eraYears.length > 0 ? eraYears.join("・") : null,
    meetings: inYear,
  }));
}

/** 年の見出し（"2026年（令和8年）"）。和暦が無ければ西暦だけ */
export function formatYearHeading(group: MeetingYearGroup): string {
  return group.eraLabel
    ? `${group.year}年（${group.eraLabel}）`
    : `${group.year}年`;
}

/** 年のジャンプナビに出す名前と件数（"2026年（23）"） */
export function formatYearJumpLabel(group: MeetingYearGroup): string {
  return `${group.year}年（${group.meetings.length}）`;
}

/** 年のセクションに付けるアンカーid（ジャンプナビのリンク先） */
export function yearSectionId(year: string): string {
  return `committee-year-${year}`;
}
