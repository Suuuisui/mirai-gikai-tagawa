import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_SESSIONS,
  type AttendanceSession,
} from "../data/attendance-data";
import {
  busiestDay,
  reiwaYearLabel,
  sessionTotal,
  yearlyAttendance,
} from "./attendance";

const SESSION: AttendanceSession = {
  key: "r3-1-teirei",
  name: "令和3年 第1回 3月定例会",
  kind: "定例会",
  days: [
    { date: "2021-02-19", general: 0 },
    { date: "2021-03-04", general: 11 },
    { date: "2021-03-05", general: 11 },
  ],
};

describe("sessionTotal / busiestDay", () => {
  it("合計と、最多の日（同数なら早い日）を返す", () => {
    expect(sessionTotal(SESSION)).toBe(22);
    expect(busiestDay(SESSION)?.date).toBe("2021-03-04");
  });

  it("日が無い会期（流会）は 0 と null", () => {
    const empty = { ...SESSION, days: [] };
    expect(sessionTotal(empty)).toBe(0);
    expect(busiestDay(empty)).toBeNull();
  });
});

describe("yearlyAttendance", () => {
  it("開催日の年ごとに日数と人数をまとめる", () => {
    const next = {
      ...SESSION,
      days: [
        { date: "2021-12-02", general: 5 },
        { date: "2022-02-24", general: 3 },
      ],
    };
    expect(yearlyAttendance([next, SESSION])).toEqual([
      { year: 2021, meetingDays: 4, total: 27 },
      { year: 2022, meetingDays: 1, total: 3 },
    ]);
  });

  it("交付を受けた表の会期ごとの合計を写し間違えていない", () => {
    const totals = new Map(
      ATTENDANCE_SESSIONS.map((s) => [s.key, sessionTotal(s)])
    );
    // 手書きの表の「計」の欄の値
    expect(totals.get("r3-1-teirei")).toBe(23);
    expect(totals.get("r3-6-teirei")).toBe(42);
    expect(totals.get("r4-3-teirei")).toBe(46);
    expect(totals.get("r5-3-teirei")).toBe(67);
    expect(totals.get("r5-5-teirei")).toBe(61);
  });
});

describe("labels", () => {
  it("和暦", () => {
    expect(reiwaYearLabel(2019)).toBe("令和元年");
    expect(reiwaYearLabel(2026)).toBe("令和8年");
  });
});
