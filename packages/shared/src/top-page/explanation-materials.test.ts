import { describe, expect, it } from "vitest";
import { parseExplanationMaterialUrls } from "./explanation-materials";

describe("parseExplanationMaterialUrls", () => {
  it("label/urlを持つ配列をそのまま返す", () => {
    const value = [
      { label: "59号 説明資料", url: "https://example.com/59.pdf" },
      { label: "60号 厚生委員会", url: "https://example.com/60.pdf" },
    ];
    expect(parseExplanationMaterialUrls(value)).toEqual(value);
  });

  it("nullやundefinedは空配列を返す", () => {
    expect(parseExplanationMaterialUrls(null)).toEqual([]);
  });

  it("配列以外のjsonb値は空配列を返す", () => {
    expect(parseExplanationMaterialUrls("text")).toEqual([]);
    expect(parseExplanationMaterialUrls(123)).toEqual([]);
    expect(parseExplanationMaterialUrls({ label: "a", url: "b" })).toEqual([]);
  });

  it("形式が不正な要素は除外する", () => {
    expect(
      parseExplanationMaterialUrls([
        { label: "正常", url: "https://example.com/ok.pdf" },
        { label: "", url: "https://example.com/empty-label.pdf" },
        { label: "urlなし" },
        "文字列要素",
        null,
        ["配列要素"],
        { label: 1, url: 2 },
      ])
    ).toEqual([{ label: "正常", url: "https://example.com/ok.pdf" }]);
  });
});
