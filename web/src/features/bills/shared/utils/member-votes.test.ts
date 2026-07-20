import { describe, expect, it } from "vitest";
import {
  countVotes,
  formatVoteCounts,
  groupEntriesByFaction,
  type MemberVoteEntry,
  parseMemberVotes,
} from "./member-votes";

function validValue(overrides: Record<string, unknown> = {}) {
  return {
    imageUrl: "https://example.com/vote.png",
    sourceUrl: "https://example.com/result.html",
    entries: [
      { name: "山田", faction: "無所属", vote: "yes" },
      { name: "田中", faction: "会派A", vote: "no" },
    ],
    ...overrides,
  };
}

describe("parseMemberVotes", () => {
  it("想定形式の値をそのまま返す", () => {
    const value = validValue();
    expect(parseMemberVotes(value)).toEqual(value);
  });

  it("notesを保持する", () => {
    const value = validValue({ notes: ["議長は採決に加わりません"] });
    expect(parseMemberVotes(value)).toEqual(value);
  });

  it("nullやundefinedはnullを返す", () => {
    expect(parseMemberVotes(null)).toBeNull();
    expect(parseMemberVotes(undefined)).toBeNull();
  });

  it("オブジェクト以外の値はnullを返す", () => {
    expect(parseMemberVotes("text")).toBeNull();
    expect(parseMemberVotes(123)).toBeNull();
    expect(parseMemberVotes([])).toBeNull();
  });

  it("imageUrl/sourceUrlが欠けている場合はnullを返す", () => {
    const { imageUrl, ...withoutImageUrl } = validValue();
    expect(parseMemberVotes(withoutImageUrl)).toBeNull();

    const { sourceUrl, ...withoutSourceUrl } = validValue();
    expect(parseMemberVotes(withoutSourceUrl)).toBeNull();
  });

  it("entriesが空配列の場合はnullを返す", () => {
    expect(parseMemberVotes(validValue({ entries: [] }))).toBeNull();
  });

  it("entriesが配列でない場合はnullを返す", () => {
    expect(parseMemberVotes(validValue({ entries: "not-array" }))).toBeNull();
  });

  it("entriesの要素の型が不正な場合はnullを返す", () => {
    expect(
      parseMemberVotes(
        validValue({
          entries: [{ name: "山田", faction: "無所属", vote: "maybe" }],
        })
      )
    ).toBeNull();
    expect(
      parseMemberVotes(
        validValue({ entries: [{ name: "", faction: "無所属", vote: "yes" }] })
      )
    ).toBeNull();
    expect(
      parseMemberVotes(validValue({ entries: [{ vote: "yes" }] }))
    ).toBeNull();
  });

  it("notesが文字列配列でない場合はnullを返す", () => {
    expect(parseMemberVotes(validValue({ notes: "not-array" }))).toBeNull();
    expect(parseMemberVotes(validValue({ notes: [1, 2] }))).toBeNull();
  });

  it("absent/not_votingを含む値も許可する", () => {
    const value = validValue({
      entries: [
        { name: "佐藤", faction: "会派B", vote: "absent" },
        { name: "鈴木", faction: "議長", vote: "not_voting" },
      ],
    });
    expect(parseMemberVotes(value)).toEqual(value);
  });
});

describe("groupEntriesByFaction", () => {
  it("会派ごとにグループ化し、出現順を維持する", () => {
    const entries: MemberVoteEntry[] = [
      { name: "山田", faction: "会派A", vote: "yes" },
      { name: "田中", faction: "会派B", vote: "no" },
      { name: "鈴木", faction: "会派A", vote: "no" },
    ];
    expect(groupEntriesByFaction(entries)).toEqual([
      {
        faction: "会派A",
        members: [
          { name: "山田", vote: "yes" },
          { name: "鈴木", vote: "no" },
        ],
      },
      {
        faction: "会派B",
        members: [{ name: "田中", vote: "no" }],
      },
    ]);
  });

  it("空配列は空配列を返す", () => {
    expect(groupEntriesByFaction([])).toEqual([]);
  });
});

describe("countVotes", () => {
  it("賛成・反対の人数を集計する", () => {
    const entries: MemberVoteEntry[] = [
      { name: "山田", faction: "会派A", vote: "yes" },
      { name: "田中", faction: "会派A", vote: "yes" },
      { name: "鈴木", faction: "会派B", vote: "no" },
      { name: "佐藤", faction: "会派B", vote: "absent" },
      { name: "伊藤", faction: "議長", vote: "not_voting" },
    ];
    expect(countVotes(entries)).toEqual({ yes: 2, no: 1 });
  });

  it("空配列は0件を返す", () => {
    expect(countVotes([])).toEqual({ yes: 0, no: 0 });
  });
});

describe("formatVoteCounts", () => {
  it("賛成・反対どちらの数かが分かる表示テキストとaria-labelを返す", () => {
    expect(formatVoteCounts(14, 5)).toEqual({
      text: "賛成14・反対5",
      ariaLabel: "賛成14対反対5",
    });
  });

  it("0対0のような境界値も整形できる", () => {
    expect(formatVoteCounts(0, 0)).toEqual({
      text: "賛成0・反対0",
      ariaLabel: "賛成0対反対0",
    });
  });
});
