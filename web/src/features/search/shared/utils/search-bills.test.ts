import { describe, expect, it } from "vitest";
import type { SearchItem } from "../types";
import { searchBills } from "./search-bills";

function item(overrides: Partial<SearchItem>): SearchItem {
  return {
    id: "bill-1",
    title: "title",
    name: "name",
    summary: "summary",
    submittedDate: null,
    status: "enacted",
    tags: [],
    ...overrides,
  };
}

describe("searchBills", () => {
  it("matches when the query is contained in the title", () => {
    const items = [
      item({ id: "1", title: "給食費の無償化について" }),
      item({ id: "2", title: "水道料金の改定について" }),
    ];

    const result = searchBills(items, "給食費");

    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("matches when the query is contained in the name, summary, or tags", () => {
    const items = [
      item({ id: "by-name", name: "議案第1号 防災対策条例" }),
      item({ id: "by-summary", summary: "水道インフラを更新する内容" }),
      item({ id: "by-tag", tags: ["防災"] }),
      item({ id: "no-match", title: "無関係な議案" }),
    ];

    expect(searchBills(items, "防災").map((r) => r.id)).toEqual(
      expect.arrayContaining(["by-name", "by-tag"])
    );
    expect(searchBills(items, "水道").map((r) => r.id)).toEqual(["by-summary"]);
  });

  it("performs an AND search across space-separated terms (including full-width spaces)", () => {
    const items = [
      item({ id: "both", title: "給食費と水道料金の改定" }),
      item({ id: "only-lunch", title: "給食費の無償化" }),
      item({ id: "only-water", title: "水道料金の改定" }),
    ];

    expect(searchBills(items, "給食費 水道").map((r) => r.id)).toEqual([
      "both",
    ]);
    // 全角スペース区切り
    expect(searchBills(items, "給食費　水道").map((r) => r.id)).toEqual([
      "both",
    ]);
  });

  it("normalizes full-width characters and katakana/hiragana before matching", () => {
    const items = [item({ id: "1", title: "ガッコウキュウショク費" })];

    // NFKC正規化（全角英数字→半角）+ カタカナ→ひらがな変換で一致する
    expect(searchBills(items, "がっこうきゅうしょく").map((r) => r.id)).toEqual(
      ["1"]
    );
  });

  it("is case-insensitive", () => {
    const items = [item({ id: "1", title: "SDGs推進条例" })];

    expect(searchBills(items, "sdgs").map((r) => r.id)).toEqual(["1"]);
  });

  it("returns all items when the query is empty", () => {
    const items = [item({ id: "1" }), item({ id: "2" })];

    expect(searchBills(items, "").map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("returns no items when nothing matches", () => {
    const items = [item({ id: "1", title: "給食費" })];

    expect(searchBills(items, "存在しないキーワード")).toEqual([]);
  });

  it("sorts results by submittedDate descending, with null dates last", () => {
    const items = [
      item({ id: "old", submittedDate: "2020-01-01" }),
      item({ id: "no-date", submittedDate: null }),
      item({ id: "new", submittedDate: "2024-05-01" }),
    ];

    expect(searchBills(items, "").map((r) => r.id)).toEqual([
      "new",
      "old",
      "no-date",
    ]);
  });

  it("slices results to a maximum of 100 items", () => {
    const items = Array.from({ length: 150 }, (_, i) =>
      item({ id: `bill-${i}`, submittedDate: `2020-01-${(i % 28) + 1}` })
    );

    expect(searchBills(items, "")).toHaveLength(100);
  });
});
