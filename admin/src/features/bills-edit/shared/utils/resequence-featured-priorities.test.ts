import { describe, expect, it } from "vitest";
import { resequenceFeaturedPriorities } from "./resequence-featured-priorities";

describe("resequenceFeaturedPriorities", () => {
  it("featuredな保存対象を指定位置に挿入し、後続だけを繰り下げる（挿入位置が既に正しければ対象自身は更新不要）", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
      { id: "c", featured_priority: 3 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: 2 };

    const result = resequenceFeaturedPriorities(others, target);

    // x は挿入後もpriority=2のまま変化しないため更新不要。
    // b(2→3)・c(3→4)だけが繰り下がり、aは変化なしで除外される。
    expect(result).toEqual(
      expect.arrayContaining([
        { id: "b", featured_priority: 3 },
        { id: "c", featured_priority: 4 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it("priorityが列の長さを超える場合は末尾に挿入され、対象自身のpriorityが更新される", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: 99 };

    const result = resequenceFeaturedPriorities(others, target);

    expect(result).toEqual([{ id: "x", featured_priority: 3 }]);
  });

  it("priorityが1の場合は先頭に挿入され、他は1つずつ繰り下がる", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: 1 };

    const result = resequenceFeaturedPriorities(others, target);

    // x は先頭(priority=1)のまま変化しないため更新不要。
    expect(result).toEqual(
      expect.arrayContaining([
        { id: "a", featured_priority: 2 },
        { id: "b", featured_priority: 3 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it("featuredでpriority未指定(null)の場合は末尾に追加される", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: null };

    const result = resequenceFeaturedPriorities(others, target);

    expect(result).toEqual([{ id: "x", featured_priority: 3 }]);
  });

  it("現行priorityがnullの議案は末尾扱いで並べられる", () => {
    const others = [
      { id: "a", featured_priority: null },
      { id: "b", featured_priority: 1 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: 2 };

    const result = resequenceFeaturedPriorities(others, target);

    // 現行順: b(1), a(null=末尾) → [b, a] の位置1(index1)にxを挿入 → [b, x, a]
    // x は挿入後もpriority=2のままなので更新不要。aだけ2→3に繰り下がる。
    expect(result).toEqual([{ id: "a", featured_priority: 3 }]);
  });

  it("非featuredの場合は列から除外し、残りを1..Nへ振り直して保存対象はnullにする", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
      { id: "c", featured_priority: 3 },
    ];
    const target = { id: "b", is_featured: false, featured_priority: 2 };

    const result = resequenceFeaturedPriorities(others, target);

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "b", featured_priority: null },
        { id: "c", featured_priority: 2 },
      ])
    );
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "a")).toBeUndefined();
  });

  it("非featuredで保存対象のpriorityが既にnullなら更新不要（他の並びに変化がなければ空配列）", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
    ];
    const target = { id: "x", is_featured: false, featured_priority: null };

    const result = resequenceFeaturedPriorities(others, target);

    expect(result).toEqual([]);
  });

  it("既存データにギャップ（不整合なpriority）があれば、対象の追加とあわせて正しく詰め直す", () => {
    const others = [
      { id: "a", featured_priority: 1 },
      { id: "b", featured_priority: 2 },
      { id: "c", featured_priority: 5 }, // 本来3のはずが5になっている想定
    ];
    const target = { id: "x", is_featured: true, featured_priority: null };

    const result = resequenceFeaturedPriorities(others, target);

    expect(result).toEqual(
      expect.arrayContaining([
        { id: "c", featured_priority: 3 },
        { id: "x", featured_priority: 4 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it("othersに保存対象自身のidが紛れ込んでいても除外して計算する", () => {
    const others = [
      { id: "x", featured_priority: 1 },
      { id: "a", featured_priority: 2 },
    ];
    const target = { id: "x", is_featured: true, featured_priority: 1 };

    const result = resequenceFeaturedPriorities(others, target);

    // x自身は除いて[a]だけを母集団とし、先頭に挿入 → [x, a] で変化なし
    expect(result).toEqual([]);
  });

  it("注目の議案が他に1件もない状態でfeatured化する場合はpriority=1になる", () => {
    const result = resequenceFeaturedPriorities([], {
      id: "x",
      is_featured: true,
      featured_priority: null,
    });

    expect(result).toEqual([{ id: "x", featured_priority: 1 }]);
  });
});
