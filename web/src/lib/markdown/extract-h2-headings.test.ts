import { describe, expect, it } from "vitest";
import { extractH2Headings } from "./extract-h2-headings";

describe("extractH2Headings", () => {
  it("h2見出しのテキストを出現順に抽出する", () => {
    const markdown = [
      "## ポイント解説",
      "本文",
      "## なぜこの議案が出たのか",
      "本文",
      "### 小見出し",
      "## 議案情報",
    ].join("\n\n");

    expect(extractH2Headings(markdown)).toEqual([
      "ポイント解説",
      "なぜこの議案が出たのか",
      "議案情報",
    ]);
  });

  it("h2が無い場合は空配列を返す", () => {
    expect(extractH2Headings("# タイトル\n\n本文のみ")).toEqual([]);
  });

  it("強調やリンクを含む見出しはプレーンテキストにする", () => {
    expect(
      extractH2Headings("## **重要**な[論点](https://example.com)")
    ).toEqual(["重要な論点"]);
  });
});
