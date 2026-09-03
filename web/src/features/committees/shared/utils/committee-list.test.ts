import { describe, expect, it } from "vitest";
import type { CommitteeMeetingListItem } from "../types";
import {
  filterByTopic,
  findAdjacentMeetings,
  sortByDateDesc,
} from "./committee-list";

function listItem(
  overrides: Partial<CommitteeMeetingListItem> = {}
): CommitteeMeetingListItem {
  return {
    id: "id-1",
    committee_name: "総務文教委員会",
    meeting_date: "2026-01-01",
    headline: "見出し",
    topics: ["money"],
    source_type: "youtube",
    ...overrides,
  };
}

describe("filterByTopic", () => {
  it("指定トピックを含む会議だけを返す", () => {
    const meetings = [
      listItem({ id: "a", topics: ["money", "welfare"] }),
      listItem({ id: "b", topics: ["waste"] }),
    ];

    expect(filterByTopic(meetings, "welfare").map((m) => m.id)).toEqual(["a"]);
  });

  it("絞り込んだトピックを topics の先頭に置く", () => {
    const meetings = [listItem({ topics: ["money", "welfare", "waste"] })];

    expect(filterByTopic(meetings, "waste")[0].topics).toEqual([
      "waste",
      "money",
      "welfare",
    ]);
  });

  it("トピック未指定なら全件を返す", () => {
    const meetings = [listItem({ id: "a" }), listItem({ id: "b" })];

    expect(filterByTopic(meetings, null)).toHaveLength(2);
  });

  it("どの会議も持たないトピックでは空になる", () => {
    expect(filterByTopic([listItem({ topics: ["money"] })], "health")).toEqual(
      []
    );
  });
});

describe("sortByDateDesc", () => {
  it("開催日の新しい順に並べる", () => {
    const meetings = [
      listItem({ id: "old", meeting_date: "2025-04-01" }),
      listItem({ id: "new", meeting_date: "2026-08-19" }),
      listItem({ id: "mid", meeting_date: "2026-01-15" }),
    ];

    expect(sortByDateDesc(meetings).map((m) => m.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("同じ日は委員会名の五十音順にする", () => {
    const meetings = [
      listItem({ id: "b", committee_name: "総務文教委員会" }),
      listItem({ id: "a", committee_name: "厚生委員会" }),
    ];

    expect(sortByDateDesc(meetings).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("元の配列を書き換えない", () => {
    const meetings = [
      listItem({ id: "old", meeting_date: "2025-04-01" }),
      listItem({ id: "new", meeting_date: "2026-08-19" }),
    ];
    sortByDateDesc(meetings);

    expect(meetings[0].id).toBe("old");
  });
});

describe("findAdjacentMeetings", () => {
  const meetings = [
    listItem({
      id: "a-old",
      committee_name: "厚生委員会",
      meeting_date: "2026-01-10",
    }),
    listItem({
      id: "a-mid",
      committee_name: "厚生委員会",
      meeting_date: "2026-03-10",
    }),
    listItem({
      id: "a-new",
      committee_name: "厚生委員会",
      meeting_date: "2026-05-10",
    }),
    listItem({
      id: "b",
      committee_name: "総務文教委員会",
      meeting_date: "2026-04-01",
    }),
  ];

  it("同じ委員会の前後の会議を返し、他の委員会は無視する", () => {
    const result = findAdjacentMeetings(meetings, {
      id: "a-mid",
      committee_name: "厚生委員会",
    });

    expect(result.older?.id).toBe("a-old");
    expect(result.newer?.id).toBe("a-new");
  });

  it("最新の会議には次が無く、最古の会議には前が無い", () => {
    expect(
      findAdjacentMeetings(meetings, {
        id: "a-new",
        committee_name: "厚生委員会",
      }).newer
    ).toBeNull();
    expect(
      findAdjacentMeetings(meetings, {
        id: "a-old",
        committee_name: "厚生委員会",
      }).older
    ).toBeNull();
  });

  it("一覧に無い会議なら両方 null", () => {
    expect(
      findAdjacentMeetings(meetings, {
        id: "zzz",
        committee_name: "厚生委員会",
      })
    ).toEqual({ older: null, newer: null });
  });
});
