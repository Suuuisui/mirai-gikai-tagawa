import { describe, expect, it } from "vitest";
import { formatMemberVotesForPrompt } from "./format-member-votes-for-prompt";

const baseMemberVotes = {
  imageUrl: "https://example.com/image.png",
  sourceUrl: "https://example.com/source",
  entries: [
    { name: "山田太郎", faction: "会派A", vote: "yes" },
    { name: "田中花子", faction: "会派A", vote: "no" },
    { name: "佐藤次郎", faction: "会派B", vote: "absent" },
    { name: "鈴木三郎", faction: "会派B", vote: "not_voting" },
  ],
};

describe("formatMemberVotesForPrompt", () => {
  it("null なら空文字を返す", () => {
    expect(formatMemberVotesForPrompt(null)).toBe("");
  });

  it("undefined なら空文字を返す", () => {
    expect(formatMemberVotesForPrompt(undefined)).toBe("");
  });

  it("形式が不正なら空文字を返す", () => {
    expect(formatMemberVotesForPrompt({ entries: [] })).toBe("");
    expect(formatMemberVotesForPrompt("invalid")).toBe("");
  });

  it("賛成・反対・欠席・採決に加わらずの人数を含む", () => {
    const result = formatMemberVotesForPrompt(baseMemberVotes);

    expect(result).toContain("賛成1・反対1・欠席1・採決に加わらず1");
  });

  it("会派ごとに議員名と賛否を列挙する", () => {
    const result = formatMemberVotesForPrompt(baseMemberVotes);

    expect(result).toContain("会派A: 山田太郎(賛成)、田中花子(反対)");
    expect(result).toContain("会派B: 佐藤次郎(欠席)、鈴木三郎(採決に加わらず)");
  });

  it("欠席・採決に加わらずが0人なら人数表示を省略する", () => {
    const result = formatMemberVotesForPrompt({
      ...baseMemberVotes,
      entries: [
        { name: "山田太郎", faction: "会派A", vote: "yes" },
        { name: "田中花子", faction: "会派A", vote: "no" },
      ],
    });

    expect(result).toContain("賛成1・反対1");
    expect(result).not.toContain("欠席");
    expect(result).not.toContain("採決に加わらず");
  });
});
