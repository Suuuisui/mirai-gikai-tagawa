import { describe, expect, it } from "vitest";
import type { CommitteeMeetingListItem } from "../types";
import {
  formatYearHeading,
  formatYearJumpLabel,
  groupMeetingsByYear,
  yearSectionId,
} from "./group-meetings-by-year";

function makeMeeting(
  id: string,
  meeting_date: string
): CommitteeMeetingListItem {
  return {
    id,
    committee_name: "総務文教委員会",
    meeting_date,
    headline: null,
    topics: [],
    source_type: "youtube",
  };
}

describe("groupMeetingsByYear", () => {
  it("年は新しい順、年の中は開催日の新しい順に並べる", () => {
    const groups = groupMeetingsByYear([
      makeMeeting("a", "2024-06-10"),
      makeMeeting("b", "2026-02-01"),
      makeMeeting("c", "2025-12-01"),
      makeMeeting("d", "2026-09-14"),
      makeMeeting("e", "2024-12-20"),
    ]);

    expect(groups.map((group) => group.year)).toEqual(["2026", "2025", "2024"]);
    expect(groups.map((group) => group.meetings.map((m) => m.id))).toEqual([
      ["d", "b"],
      ["c"],
      ["e", "a"],
    ]);
  });

  it("入力の並びが何であっても結果は同じ", () => {
    const meetings = [
      makeMeeting("a", "2024-06-10"),
      makeMeeting("b", "2026-02-01"),
      makeMeeting("c", "2025-12-01"),
    ];
    expect(groupMeetingsByYear([...meetings].reverse())).toEqual(
      groupMeetingsByYear(meetings)
    );
  });

  it("同じ日の会議は id 順にして、並びが入れ替わらないようにする", () => {
    const groups = groupMeetingsByYear([
      makeMeeting("b", "2026-02-01"),
      makeMeeting("a", "2026-02-01"),
    ]);
    expect(groups[0].meetings.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("全会議がどれか1つの年に入り、取りこぼしも重複もない", () => {
    const meetings = [
      makeMeeting("a", "2021-01-21"),
      makeMeeting("b", "2021-12-31"),
      makeMeeting("c", "2022-01-01"),
      makeMeeting("d", "2026-10-08"),
    ];
    const ids = groupMeetingsByYear(meetings).flatMap((group) =>
      group.meetings.map((m) => m.id)
    );
    expect(ids.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("和暦の年を添える", () => {
    const groups = groupMeetingsByYear([
      makeMeeting("a", "2026-10-08"),
      makeMeeting("b", "2021-01-21"),
    ]);
    expect(groups.map((group) => group.eraLabel)).toEqual([
      "令和8年",
      "令和3年",
    ]);
  });

  it("元年は「元年」と書く", () => {
    const [group] = groupMeetingsByYear([makeMeeting("a", "2019-06-12")]);
    expect(group.eraLabel).toBe("令和元年");
  });

  it("年の途中で元号が変わった年は、新しい元号から並べる", () => {
    const [group] = groupMeetingsByYear([
      makeMeeting("a", "2019-03-08"),
      makeMeeting("b", "2019-09-10"),
      makeMeeting("c", "2019-06-12"),
    ]);
    expect(group.eraLabel).toBe("令和元年・平成31年");
    expect(group.meetings.map((m) => m.id)).toEqual(["b", "c", "a"]);
  });

  it("会議が無ければ空", () => {
    expect(groupMeetingsByYear([])).toEqual([]);
  });
});

describe("formatYearHeading", () => {
  it("西暦に和暦を添える", () => {
    const [group] = groupMeetingsByYear([makeMeeting("a", "2026-10-08")]);
    expect(formatYearHeading(group)).toBe("2026年（令和8年）");
  });

  it("元号が変わった年は両方添える", () => {
    const [group] = groupMeetingsByYear([
      makeMeeting("a", "2019-03-08"),
      makeMeeting("b", "2019-09-10"),
    ]);
    expect(formatYearHeading(group)).toBe("2019年（令和元年・平成31年）");
  });

  it("和暦にできない年は西暦だけ", () => {
    expect(
      formatYearHeading({ year: "1900", eraLabel: null, meetings: [] })
    ).toBe("1900年");
  });
});

describe("formatYearJumpLabel", () => {
  it("年と、その年の会議数を並べる", () => {
    const [group] = groupMeetingsByYear([
      makeMeeting("a", "2026-02-01"),
      makeMeeting("b", "2026-09-14"),
      makeMeeting("c", "2026-10-08"),
    ]);
    expect(formatYearJumpLabel(group)).toBe("2026年（3）");
  });
});

describe("yearSectionId", () => {
  it("年ごとにちがうアンカーidになる", () => {
    expect(yearSectionId("2026")).toBe("committee-year-2026");
    expect(yearSectionId("2025")).not.toBe(yearSectionId("2026"));
  });
});
