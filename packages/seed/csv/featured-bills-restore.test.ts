import { describe, expect, it } from "vitest";
import {
  type FeaturedBillSnapshot,
  type NewBillInfo,
  resolveFeaturedBillUpdates,
} from "./featured-bills-restore";

function makeSnapshot(
  overrides: Partial<FeaturedBillSnapshot>
): FeaturedBillSnapshot {
  return {
    name: "議案第7号 予算について",
    is_featured: true,
    featured_priority: 1,
    ...overrides,
  };
}

describe("resolveFeaturedBillUpdates", () => {
  it("議案名が一致する新データがあれば新bill_idに付け替えて復元する", () => {
    const snapshot = makeSnapshot({ name: "議案第7号 予算について" });
    const newBills: NewBillInfo[] = [
      { id: "bill-new-1", name: "議案第7号 予算について" },
      { id: "bill-new-2", name: "議案第8号 条例について" },
    ];

    const { restored, skipped } = resolveFeaturedBillUpdates(
      [snapshot],
      newBills
    );

    expect(skipped).toHaveLength(0);
    expect(restored).toHaveLength(1);
    expect(restored[0]).toEqual({
      id: "bill-new-1",
      is_featured: true,
      featured_priority: 1,
    });
  });

  it("is_featured / featured_priority の値をそのまま引き継ぐ", () => {
    const snapshot = makeSnapshot({
      is_featured: true,
      featured_priority: 99,
    });
    const newBills: NewBillInfo[] = [
      { id: "bill-new-1", name: snapshot.name },
    ];

    const { restored } = resolveFeaturedBillUpdates([snapshot], newBills);

    expect(restored[0].featured_priority).toBe(99);
  });

  it("議案名が一致する新データが無い場合はスキップする", () => {
    const snapshot = makeSnapshot({ name: "議案第7号 予算について" });
    const newBills: NewBillInfo[] = [
      { id: "bill-new-1", name: "議案第9号 別の議案" },
    ];

    const { restored, skipped } = resolveFeaturedBillUpdates(
      [snapshot],
      newBills
    );

    expect(restored).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].name).toBe("議案第7号 予算について");
    expect(skipped[0].reason).toMatch(/一致する新データが見つかりません/);
  });

  it("同名の議案が新データ内で複数存在する場合はスキップする", () => {
    const snapshot = makeSnapshot({ name: "議案第7号 予算について" });
    const newBills: NewBillInfo[] = [
      { id: "bill-new-1", name: "議案第7号 予算について" },
      { id: "bill-new-2", name: "議案第7号 予算について" },
    ];

    const { restored, skipped } = resolveFeaturedBillUpdates(
      [snapshot],
      newBills
    );

    expect(restored).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/一意に特定できません/);
  });

  it("スナップショットが空なら何も復元しない", () => {
    const newBills: NewBillInfo[] = [
      { id: "bill-new-1", name: "議案第7号 予算について" },
    ];

    const { restored, skipped } = resolveFeaturedBillUpdates([], newBills);

    expect(restored).toHaveLength(0);
    expect(skipped).toHaveLength(0);
  });

  it("複数スナップショットを個別に解決する", () => {
    const snapshots: FeaturedBillSnapshot[] = [
      makeSnapshot({ name: "議案A", featured_priority: 1 }),
      makeSnapshot({ name: "議案B", featured_priority: 2 }),
    ];
    const newBills: NewBillInfo[] = [
      { id: "bill-a", name: "議案A" },
      { id: "bill-b", name: "議案B" },
    ];

    const { restored, skipped } = resolveFeaturedBillUpdates(
      snapshots,
      newBills
    );

    expect(skipped).toHaveLength(0);
    expect(restored).toHaveLength(2);
    expect(restored.find((r) => r.id === "bill-a")?.featured_priority).toBe(
      1
    );
    expect(restored.find((r) => r.id === "bill-b")?.featured_priority).toBe(
      2
    );
  });
});
