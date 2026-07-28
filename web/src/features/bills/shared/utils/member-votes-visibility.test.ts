import { describe, expect, it } from "vitest";
import { isMemberVotesSectionVisible } from "./member-votes-visibility";

const validMemberVotes = {
  imageUrl: "https://example.com/votes.png",
  sourceUrl: "https://example.com/results",
  entries: [{ name: "田中", faction: "無会派", vote: "yes" }],
};

describe("isMemberVotesSectionVisible", () => {
  it("賛否表（member_votes）がある議案は表示される", () => {
    expect(
      isMemberVotesSectionVisible(
        {
          member_votes: validMemberVotes,
          name: "議案第1号　テスト条例",
          status_note: "原案可決",
        },
        "r8-1-teirei"
      )
    ).toBe(true);
  });

  it("賛否表が無く可決系の結果なら全会一致として表示される", () => {
    expect(
      isMemberVotesSectionVisible(
        {
          member_votes: null,
          name: "議案第1号　テスト条例",
          status_note: "原案可決",
        },
        "r8-1-teirei"
      )
    ).toBe(true);
  });

  it("無記名投票の議案は表示される", () => {
    expect(
      isMemberVotesSectionVisible(
        {
          member_votes: null,
          name: "議案第38号　村上卓哉田川市長に対する不信任決議について",
          status_note: "否決",
        },
        "r7-1-teirei"
      )
    ).toBe(true);
  });

  it("判定できない議案（会期不明）は表示されない", () => {
    expect(
      isMemberVotesSectionVisible(
        {
          member_votes: null,
          name: "議案第1号　テスト条例",
          status_note: "原案可決",
        },
        null
      )
    ).toBe(false);
  });

  it("賛否表が無く否決系の結果は表示されない", () => {
    expect(
      isMemberVotesSectionVisible(
        {
          member_votes: null,
          name: "議案第1号　テスト条例",
          status_note: "否決",
        },
        "r8-1-teirei"
      )
    ).toBe(false);
  });
});
