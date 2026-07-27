import { describe, expect, it } from "vitest";
import { resolveVoteDisclosure } from "./vote-disclosure";

function input(
  overrides: Partial<Parameters<typeof resolveVoteDisclosure>[0]> = {}
) {
  return {
    hasMemberVotes: false,
    billName: "議案第1号　田川市一般会計補正予算",
    sessionSlug: "r7-6-teirei",
    statusNote: "原案可決",
    ...overrides,
  };
}

describe("resolveVoteDisclosure", () => {
  it("member_votesがある議案はpublished", () => {
    expect(resolveVoteDisclosure(input({ hasMemberVotes: true }))).toBe(
      "published"
    );
  });

  it("賛否表なし＋可決系結果は全会一致", () => {
    for (const statusNote of [
      "原案可決",
      "可決",
      "同意",
      "承認",
      "認定",
      "採択",
    ]) {
      expect(resolveVoteDisclosure(input({ statusNote }))).toBe("unanimous");
    }
  });

  it("無記名投票の議案はsecret_ballot（可決系でも全会一致にしない）", () => {
    expect(
      resolveVoteDisclosure(
        input({
          sessionSlug: "r7-1-teirei",
          billName: "議案第40号　村上卓哉田川市長に対する辞職勧告決議について",
          statusNote: "原案可決",
        })
      )
    ).toBe("secret_ballot");
  });

  it("同名議案番号でも件名が異なれば無記名扱いにならない（r7-6の議案第44号衝突）", () => {
    expect(
      resolveVoteDisclosure(
        input({
          sessionSlug: "r7-6-teirei",
          billName: "議案第44号　工事請負契約の締結について",
          statusNote: "原案可決",
        })
      )
    ).toBe("unanimous");
    expect(
      resolveVoteDisclosure(
        input({
          sessionSlug: "r7-6-teirei",
          billName: "議案第44号　田川市議会議長不信任決議について",
          statusNote: "原案可決",
        })
      )
    ).toBe("secret_ballot");
  });

  it("議決結果ページが無い会期（r1-5-teirei）はunknown", () => {
    expect(resolveVoteDisclosure(input({ sessionSlug: "r1-5-teirei" }))).toBe(
      "unknown"
    );
  });

  it("否決・修正議決・継続審議・結果なしはunknown", () => {
    for (const statusNote of ["否決", "修正議決", "継続審議", null]) {
      expect(resolveVoteDisclosure(input({ statusNote }))).toBe("unknown");
    }
  });

  it("会期不明（sessionSlugなし）はunknown", () => {
    expect(resolveVoteDisclosure(input({ sessionSlug: null }))).toBe("unknown");
  });
});
