import type { AttendanceDay, AttendanceSession } from "../data/attendance-data";

/** 会期の傍聴者の合計（延べ人数） */
export function sessionTotal(session: AttendanceSession): number {
  return session.days.reduce((sum, d) => sum + d.general, 0);
}

/** 会期でいちばん傍聴者が多かった日（日が無ければ null。同数なら早い日） */
export function busiestDay(session: AttendanceSession): AttendanceDay | null {
  return session.days.reduce<AttendanceDay | null>(
    (best, d) => (best === null || d.general > best.general ? d : best),
    null
  );
}

export interface YearlyAttendance {
  /** 西暦 */
  year: number;
  /** 本会議が開かれた日数 */
  meetingDays: number;
  /** 傍聴者の延べ人数 */
  total: number;
}

/** 開催日の年ごとに、本会議の日数と傍聴者の延べ人数をまとめる（古い順） */
export function yearlyAttendance(
  sessions: readonly AttendanceSession[]
): YearlyAttendance[] {
  const byYear = new Map<number, YearlyAttendance>();
  for (const d of sessions.flatMap((s) => s.days)) {
    const year = Number(d.date.slice(0, 4));
    const row = byYear.get(year) ?? { year, meetingDays: 0, total: 0 };
    row.meetingDays += 1;
    row.total += d.general;
    byYear.set(year, row);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

/** 「令和3年」のような和暦（令和の年だけ扱う） */
export function reiwaYearLabel(year: number): string {
  const n = year - 2018;
  return `令和${n === 1 ? "元" : n}年`;
}
