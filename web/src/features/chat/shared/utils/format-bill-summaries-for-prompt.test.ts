import { describe, expect, it } from "vitest";
import { formatBillSummariesForPrompt } from "./format-bill-summaries-for-prompt";

describe("formatBillSummariesForPrompt", () => {
  it("空配列なら空配列のJSON文字列を返す", () => {
    expect(formatBillSummariesForPrompt([])).toBe("[]");
  });

  it("各議案に詳細ページURL(url)を付与する", () => {
    const result = formatBillSummariesForPrompt([
      {
        id: "abc-123",
        name: "テスト議案",
        summary: "要約",
        tags: ["タグ1"],
        isFeatured: true,
      },
    ]);

    expect(JSON.parse(result)).toEqual([
      {
        name: "テスト議案",
        summary: "要約",
        tags: ["タグ1"],
        isFeatured: true,
        url: "/bills/abc-123",
      },
    ]);
  });

  it("summary・tags・isFeatured が無くてもURLだけ付与して返す", () => {
    const result = formatBillSummariesForPrompt([{ id: "xyz", name: "議案A" }]);

    expect(JSON.parse(result)).toEqual([{ name: "議案A", url: "/bills/xyz" }]);
  });

  it("複数議案をまとめて変換する", () => {
    const result = formatBillSummariesForPrompt([
      { id: "1", name: "議案1" },
      { id: "2", name: "議案2" },
    ]);

    expect(JSON.parse(result)).toEqual([
      { name: "議案1", url: "/bills/1" },
      { name: "議案2", url: "/bills/2" },
    ]);
  });
});
