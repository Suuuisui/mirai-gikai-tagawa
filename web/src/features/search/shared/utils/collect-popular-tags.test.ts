import { describe, expect, it } from "vitest";
import type { SearchItem } from "../types";
import { collectPopularTags } from "./collect-popular-tags";

function makeItem(tags: string[]): SearchItem {
  return {
    id: crypto.randomUUID(),
    title: "タイトル",
    name: "議案第1号",
    summary: "",
    submittedDate: null,
    status: "enacted",
    tags,
  };
}

describe("collectPopularTags", () => {
  it("出現数の多い順に並べる", () => {
    const items = [
      makeItem(["予算", "条例"]),
      makeItem(["予算"]),
      makeItem(["予算", "意見書"]),
      makeItem(["条例"]),
    ];
    expect(collectPopularTags(items, 10)).toEqual(["予算", "条例", "意見書"]);
  });

  it("limit件に切り詰める", () => {
    const items = [
      makeItem(["予算", "条例"]),
      makeItem(["予算"]),
      makeItem(["条例"]),
      makeItem(["意見書"]),
    ];
    expect(collectPopularTags(items, 2)).toEqual(["予算", "条例"]);
  });

  it("出現数が同じ場合はタグ名の昇順で安定する", () => {
    const items = [makeItem(["決算", "決議"]), makeItem(["決議", "決算"])];
    expect(collectPopularTags(items, 10)).toEqual(["決算", "決議"]);
  });

  it("タグがない場合は空配列を返す", () => {
    expect(collectPopularTags([makeItem([])], 5)).toEqual([]);
  });
});
