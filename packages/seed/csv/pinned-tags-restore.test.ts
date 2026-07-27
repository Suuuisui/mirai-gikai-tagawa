import { describe, expect, it } from "vitest";
import {
  billsTagsLinkKey,
  type PinnedTagSnapshot,
  resolvePinnedTagUpdates,
} from "./pinned-tags-restore";

const newTags = [
  { id: "tag-yosan", label: "予算" },
  { id: "tag-jourei", label: "条例" },
];

const matchKeyToNewBillId = new Map([
  ["r7-2::議案第1号", "bill-1"],
  ["r7-2::議案第2号", "bill-2"],
]);

const existingLinkKeys = new Set([
  billsTagsLinkKey("tag-yosan", "bill-1"),
  billsTagsLinkKey("tag-yosan", "bill-2"),
  billsTagsLinkKey("tag-jourei", "bill-2"),
]);

function snapshot(
  overrides: Partial<PinnedTagSnapshot> = {}
): PinnedTagSnapshot {
  return {
    tagLabel: "予算",
    billMatchKey: "r7-2::議案第1号",
    pinned_priority: 1,
    ...overrides,
  };
}

describe("resolvePinnedTagUpdates", () => {
  it("タグラベルと議案マッチキーが一致する場合、新しいIDで復元される", () => {
    const result = resolvePinnedTagUpdates(
      [
        snapshot(),
        snapshot({
          tagLabel: "条例",
          billMatchKey: "r7-2::議案第2号",
          pinned_priority: 2,
        }),
      ],
      newTags,
      matchKeyToNewBillId,
      existingLinkKeys
    );

    expect(result.restored).toEqual([
      { tag_id: "tag-yosan", bill_id: "bill-1", pinned_priority: 1 },
      { tag_id: "tag-jourei", bill_id: "bill-2", pinned_priority: 2 },
    ]);
    expect(result.skipped).toHaveLength(0);
  });

  it("ラベル一致する新タグが無い場合はスキップされる", () => {
    const result = resolvePinnedTagUpdates(
      [snapshot({ tagLabel: "廃止済みタグ" })],
      newTags,
      matchKeyToNewBillId,
      existingLinkKeys
    );
    expect(result.restored).toHaveLength(0);
    expect(result.skipped[0]?.reason).toContain("新タグ");
  });

  it("議案マッチキーが一致しない場合はスキップされる", () => {
    const result = resolvePinnedTagUpdates(
      [snapshot({ billMatchKey: "r7-2::改名された議案" })],
      newTags,
      matchKeyToNewBillId,
      existingLinkKeys
    );
    expect(result.restored).toHaveLength(0);
    expect(result.skipped[0]?.reason).toContain("新議案");
  });

  it("新データで議案にタグが付いていない場合はスキップされる", () => {
    const result = resolvePinnedTagUpdates(
      // 条例タグ × 議案第1号 のリンクは existingLinkKeys に無い
      [snapshot({ tagLabel: "条例", billMatchKey: "r7-2::議案第1号" })],
      newTags,
      matchKeyToNewBillId,
      existingLinkKeys
    );
    expect(result.restored).toHaveLength(0);
    expect(result.skipped[0]?.reason).toContain("タグが付いていません");
  });

  it("スナップショットが空なら何もしない", () => {
    const result = resolvePinnedTagUpdates(
      [],
      newTags,
      matchKeyToNewBillId,
      existingLinkKeys
    );
    expect(result.restored).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});
