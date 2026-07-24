import { describe, expect, it } from "vitest";
import {
  buildFeaturedBillUpdates,
  buildFeaturedTagUpdates,
} from "./build-featured-updates";

describe("buildFeaturedBillUpdates", () => {
  it("新しく選ばれた議案は位置(1始まり)のpriority付きでfeatured化される", () => {
    const updates = buildFeaturedBillUpdates([], ["a", "b"]);
    expect(updates).toEqual([
      { id: "a", is_featured: true, featured_priority: 1 },
      { id: "b", is_featured: true, featured_priority: 2 },
    ]);
  });

  it("外された議案はis_featured=false・priority=nullになる", () => {
    const updates = buildFeaturedBillUpdates(
      [
        { id: "a", featured_priority: 1 },
        { id: "b", featured_priority: 2 },
      ],
      ["a"]
    );
    expect(updates).toEqual([
      { id: "b", is_featured: false, featured_priority: null },
    ]);
  });

  it("位置もfeatured状態も変わらない議案は更新対象に含めない", () => {
    const updates = buildFeaturedBillUpdates(
      [
        { id: "a", featured_priority: 1 },
        { id: "b", featured_priority: 2 },
      ],
      ["a", "b"]
    );
    expect(updates).toEqual([]);
  });

  it("並び替えで位置が変わった議案だけが更新される", () => {
    const updates = buildFeaturedBillUpdates(
      [
        { id: "a", featured_priority: 1 },
        { id: "b", featured_priority: 2 },
        { id: "c", featured_priority: 3 },
      ],
      ["b", "a", "c"]
    );
    expect(updates).toEqual([
      { id: "b", is_featured: true, featured_priority: 1 },
      { id: "a", is_featured: true, featured_priority: 2 },
    ]);
  });

  it("歯抜けpriority（削除の名残など）は同じ並びでも連番に整列し直す", () => {
    const updates = buildFeaturedBillUpdates(
      [
        { id: "a", featured_priority: 2 },
        { id: "b", featured_priority: 5 },
      ],
      ["a", "b"]
    );
    expect(updates).toEqual([
      { id: "a", is_featured: true, featured_priority: 1 },
      { id: "b", is_featured: true, featured_priority: 2 },
    ]);
  });
});

describe("buildFeaturedTagUpdates", () => {
  it("選択されたタグは位置のpriorityになり、外れたタグはnullになる", () => {
    const updates = buildFeaturedTagUpdates(
      [
        { id: "t1", featured_priority: 1 },
        { id: "t2", featured_priority: 2 },
        { id: "t3", featured_priority: null },
      ],
      ["t3", "t1"]
    );
    expect(updates).toEqual([
      { id: "t3", featured_priority: 1 },
      { id: "t1", featured_priority: 2 },
      { id: "t2", featured_priority: null },
    ]);
  });

  it("変更がなければ空配列を返す", () => {
    const updates = buildFeaturedTagUpdates(
      [
        { id: "t1", featured_priority: 1 },
        { id: "t2", featured_priority: null },
      ],
      ["t1"]
    );
    expect(updates).toEqual([]);
  });

  it("もともと非表示のタグが選択されないままなら更新しない（null→nullの書き込みをしない）", () => {
    const updates = buildFeaturedTagUpdates(
      [{ id: "t1", featured_priority: null }],
      []
    );
    expect(updates).toEqual([]);
  });
});
