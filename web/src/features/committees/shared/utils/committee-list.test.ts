import { describe, expect, it } from "vitest";
import type {
  CommitteeMeetingListItem,
  CommitteeMeetingSummary,
} from "../types";
import { filterByTopic, sortByDateDesc, toListItems } from "./committee-list";

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

describe("toListItems", () => {
  it("一覧に使わない要約や要点を落とす", () => {
    const summary: CommitteeMeetingSummary = {
      id: "id-1",
      committee_name: "厚生委員会",
      meeting_date: "2026-02-03",
      title: "厚生委員会（令和8年2月3日）",
      headline: "保育料の改定案を審査",
      topics: ["welfare"],
      summary: "長い要約",
      key_points: ["要点1", "要点2"],
      agenda_items: ["議題1"],
      attendees: ["佐藤 俊一"],
      source_type: "disclosure",
      source_note: null,
      youtube_url: null,
      updated_at: "2026-02-04T00:00:00Z",
    };

    expect(toListItems([summary])).toEqual([
      {
        id: "id-1",
        committee_name: "厚生委員会",
        meeting_date: "2026-02-03",
        headline: "保育料の改定案を審査",
        topics: ["welfare"],
        source_type: "disclosure",
      },
    ]);
  });
});

describe("filterByTopic", () => {
  it("指定トピックを含む会議だけを返す", () => {
    const meetings = [
      listItem({ id: "a", topics: ["money", "welfare"] }),
      listItem({ id: "b", topics: ["waste"] }),
    ];

    expect(filterByTopic(meetings, "welfare").map((m) => m.id)).toEqual(["a"]);
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
