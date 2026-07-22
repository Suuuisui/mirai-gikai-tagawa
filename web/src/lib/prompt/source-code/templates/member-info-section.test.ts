import { describe, expect, it } from "vitest";
import { buildMemberVotesAndSponsorsSection } from "./member-info-section";

describe("buildMemberVotesAndSponsorsSection", () => {
  it("両方空文字なら空文字列を返す", () => {
    expect(buildMemberVotesAndSponsorsSection("", "")).toBe("");
  });

  it("両方空白のみなら空文字列を返す", () => {
    expect(buildMemberVotesAndSponsorsSection("  \n", "\n  ")).toBe("");
  });

  it("memberVotes のみ渡すと議員別の賛否セクションのみ含む", () => {
    const result = buildMemberVotesAndSponsorsSection("賛成1・反対1", "");

    expect(result).toContain("### 議員別の賛否");
    expect(result).toContain("賛成1・反対1");
    expect(result).not.toContain("### 提出者・賛成者");
  });

  it("sponsors のみ渡すと提出者セクションのみ含む", () => {
    const result = buildMemberVotesAndSponsorsSection("", "提出者: 山田太郎");

    expect(result).not.toContain("### 議員別の賛否");
    expect(result).toContain("### 提出者・賛成者");
    expect(result).toContain("提出者: 山田太郎");
  });

  it("両方渡すと両セクションを含む", () => {
    const result = buildMemberVotesAndSponsorsSection(
      "賛成1・反対1",
      "提出者: 山田太郎"
    );

    expect(result).toContain("### 議員別の賛否");
    expect(result).toContain("### 提出者・賛成者");
  });

  it("中立性についての注意書きを必ず含む", () => {
    const result = buildMemberVotesAndSponsorsSection("賛成1・反対1", "");

    expect(result).toContain("評価・批判する表現はしないでください");
    expect(result).toContain("判断は利用者に委ねてください");
  });
});
