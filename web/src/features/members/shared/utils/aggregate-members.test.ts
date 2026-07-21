import { describe, expect, it } from "vitest";
import type { MemberVotes } from "@/features/bills/shared/utils/member-votes";
import {
  aggregateMemberSummaries,
  type BillWithMemberVotes,
  collectMemberVoteRecords,
} from "./aggregate-members";

function memberVotes(
  entries: Array<[string, string, MemberVotes["entries"][number]["vote"]]>
): MemberVotes {
  return {
    imageUrl: "https://example.com/votes.png",
    sourceUrl: "https://example.com/result.html",
    entries: entries.map(([name, faction, vote]) => ({ name, faction, vote })),
  };
}

const items: BillWithMemberVotes[] = [
  {
    bill: { id: "bill-old", submitted_date: "2021-03-01" },
    memberVotes: memberVotes([
      ["佐藤", "旧会派", "yes"],
      ["鈴木", "令和", "no"],
    ]),
  },
  {
    bill: { id: "bill-new", submitted_date: "2024-06-01" },
    memberVotes: memberVotes([
      ["佐藤", "新会派", "no"],
      ["鈴木", "令和", "absent"],
      ["田中", "共産党", "not_voting"],
    ]),
  },
  {
    bill: { id: "bill-nodate", submitted_date: null },
    memberVotes: memberVotes([["佐藤", "新会派", "yes"]]),
  },
];

describe("aggregateMemberSummaries", () => {
  it("議員ごとに賛否を集計し、新しい議案の賛否表での登場順に返す", () => {
    const summaries = aggregateMemberSummaries(items);
    expect(summaries.map((s) => s.name)).toEqual(["佐藤", "鈴木", "田中"]);

    const sato = summaries[0];
    expect(sato.counts).toEqual({ yes: 2, no: 1, absent: 0, not_voting: 0 });
    expect(sato.billCount).toBe(3);
  });

  it("会派は新しい議案での所属を先頭に重複なく記録する", () => {
    const sato = aggregateMemberSummaries(items).find((s) => s.name === "佐藤");
    expect(sato?.latestFaction).toBe("新会派");
    expect(sato?.factions).toEqual(["新会派", "旧会派"]);
  });

  it("空配列なら空の一覧を返す", () => {
    expect(aggregateMemberSummaries([])).toEqual([]);
  });
});

describe("collectMemberVoteRecords", () => {
  it("指定議員の記録だけを議決日の新しい順（日付なしは末尾）に返す", () => {
    const records = collectMemberVoteRecords(items, "佐藤");
    expect(records.map((r) => r.bill.id)).toEqual([
      "bill-new",
      "bill-old",
      "bill-nodate",
    ]);
    expect(records.map((r) => r.vote)).toEqual(["no", "yes", "yes"]);
    expect(records[0].faction).toBe("新会派");
  });

  it("登場しない議員は空配列を返す", () => {
    expect(collectMemberVoteRecords(items, "存在しない")).toEqual([]);
  });
});
