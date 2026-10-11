import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";
import { describe, expect, it } from "vitest";
import { buildOfficialMinutesIndex } from "./official-minutes";

const records: OfficialMinutesRecord[] = [
  {
    date: "2026-07-01",
    fileName: "R080701A",
    sessionName: "令和8年 第4回定例会",
    dayLabel: "第4日",
  },
  {
    date: "2026-06-12",
    fileName: "R080612A",
    sessionName: "令和8年 第4回定例会",
    dayLabel: "第1日",
  },
  {
    date: "2026-05-29",
    fileName: "R080529A",
    sessionName: "令和8年 第3回臨時会",
    dayLabel: "第1日",
  },
];

describe("buildOfficialMinutesIndex", () => {
  const index = buildOfficialMinutesIndex(records, "abc123");

  it("日付からその日の会議録のリンクを引く", () => {
    expect(index.findByDate("2026-06-12")).toEqual({
      date: "2026-06-12",
      url: "https://www.kensakusystem.jp/tagawa/cgi-bin3/ResultFrame.exe?Code=abc123&fileName=R080612A&startPos=0",
      sessionName: "令和8年 第4回定例会",
      dayLabel: "第1日",
    });
  });

  it("時刻つきの日付でも引ける", () => {
    expect(index.findByDate("2026-06-12T00:00:00+00:00")?.dayLabel).toBe(
      "第1日"
    );
  });

  it("会議録が公開されていない日は null", () => {
    expect(index.findByDate("2026-09-07")).toBeNull();
  });

  it("期間内の会議録を古い順に返す（両端を含む）", () => {
    expect(
      index.findInRange("2026-06-12", "2026-07-01").map((link) => link.date)
    ).toEqual(["2026-06-12", "2026-07-01"]);
    expect(index.findInRange("2026-08-01", "2026-08-31")).toEqual([]);
  });

  it("公開されている範囲と件数を返す", () => {
    expect(index.earliestDate).toBe("2026-05-29");
    expect(index.latestDate).toBe("2026-07-01");
    expect(index.count).toBe(3);
  });

  it("1件も無いときは範囲が null", () => {
    const empty = buildOfficialMinutesIndex([], "abc123");
    expect(empty.latestDate).toBeNull();
    expect(empty.earliestDate).toBeNull();
    expect(empty.count).toBe(0);
    expect(empty.findByDate("2026-06-12")).toBeNull();
  });

  it("同じ日に2つあれば、ファイル名の若い方を使う", () => {
    const duplicated = buildOfficialMinutesIndex(
      [
        { ...records[1], fileName: "R080612B" },
        { ...records[1], fileName: "R080612A" },
      ],
      "abc123"
    );
    expect(duplicated.findByDate("2026-06-12")?.url).toContain("R080612A");
  });
});
