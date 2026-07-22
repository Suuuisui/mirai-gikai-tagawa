import { describe, expect, it } from "vitest";
import { formatSponsorsForPrompt } from "./format-sponsors-for-prompt";

describe("formatSponsorsForPrompt", () => {
  it("null なら空文字を返す", () => {
    expect(formatSponsorsForPrompt(null)).toBe("");
  });

  it("undefined なら空文字を返す", () => {
    expect(formatSponsorsForPrompt(undefined)).toBe("");
  });

  it("形式が不正なら空文字を返す（proposers が空等）", () => {
    expect(
      formatSponsorsForPrompt({
        proposers: [],
        sourceUrl: "https://example.com/source",
      })
    ).toBe("");
  });

  it("提出者のみの場合は提出者行のみ返す", () => {
    const result = formatSponsorsForPrompt({
      proposers: [{ name: "山田太郎" }],
      sourceUrl: "https://example.com/source",
    });

    expect(result).toBe("提出者: 山田太郎");
  });

  it("提出者・賛成者がいる場合は両方を整形する", () => {
    const result = formatSponsorsForPrompt({
      proposers: [{ name: "山田太郎" }, { name: "田中花子" }],
      supporters: [{ name: "佐藤次郎" }],
      sourceUrl: "https://example.com/source",
    });

    expect(result).toBe(
      "提出者: 山田太郎、田中花子\n賛成者（連署議員）: 佐藤次郎"
    );
  });

  it("title があれば氏名の前に付与する", () => {
    const result = formatSponsorsForPrompt({
      proposers: [{ name: "山田太郎", title: "総務委員長" }],
      sourceUrl: "https://example.com/source",
    });

    expect(result).toBe("提出者: 総務委員長 山田太郎");
  });
});
