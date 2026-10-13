import { describe, expect, it } from "vitest";
import {
  getBillDateLabel,
  getCardStatusLabel,
  getStatusVariant,
} from "./bill-status";

describe("getCardStatusLabel", () => {
  it.each([
    ["introduced", "田川市議会審議中"],
    ["in_originating_house", "田川市議会審議中"],
    ["in_receiving_house", "田川市議会審議中"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getCardStatusLabel(status)).toBe(expected);
  });

  it("enacted → 可決", () => {
    expect(getCardStatusLabel("enacted")).toBe("可決");
  });

  it("rejected → 否決", () => {
    expect(getCardStatusLabel("rejected")).toBe("否決");
  });

  it("preparing → 議案提出前", () => {
    expect(getCardStatusLabel("preparing")).toBe("議案提出前");
  });

  describe("議決済みの議案は status_note の語を出す", () => {
    it.each([
      ["enacted", "認定", "認定"],
      ["enacted", "同意", "同意"],
      ["enacted", "承認", "承認"],
      ["enacted", "原案可決", "可決"],
      ["enacted", "認定（本会議の中継映像より）", "認定"],
      ["rejected", "不認定（本会議の中継映像より）", "不認定"],
      ["rejected", "否決", "否決"],
    ] as const)("%s・「%s」→ %s", (status, statusNote, expected) => {
      expect(getCardStatusLabel(status, statusNote)).toBe(expected);
    });

    it("status_note が空・想定外の語なら可決・否決のまま", () => {
      expect(getCardStatusLabel("enacted", null)).toBe("可決");
      expect(getCardStatusLabel("rejected", "")).toBe("否決");
      expect(getCardStatusLabel("enacted", "懲罰を科す(陳謝)")).toBe("可決");
    });
  });

  it.each([
    ["introduced", "常任委員会で原案可決（本会議の議決結果は公表後に掲載）"],
    ["introduced", "不認定"],
    ["in_originating_house", "継続審議"],
    ["in_receiving_house", "認定"],
  ] as const)("審議中 %s は status_note「%s」があっても審議中のまま", (status, statusNote) => {
    expect(getCardStatusLabel(status, statusNote)).toBe("田川市議会審議中");
  });

  it("preparing は status_note があっても議案提出前のまま", () => {
    expect(getCardStatusLabel("preparing", "認定")).toBe("議案提出前");
  });
});

describe("getStatusVariant", () => {
  it.each([
    ["introduced", "light"],
    ["in_originating_house", "light"],
    ["in_receiving_house", "light"],
  ] as const)("審議中ステータス %s → %s", (status, expected) => {
    expect(getStatusVariant(status)).toBe(expected);
  });

  it("enacted → default", () => {
    expect(getStatusVariant("enacted")).toBe("default");
  });

  it("rejected → dark", () => {
    expect(getStatusVariant("rejected")).toBe("dark");
  });

  it("preparing → muted", () => {
    expect(getStatusVariant("preparing")).toBe("muted");
  });
});

describe("getBillDateLabel", () => {
  it.each([
    ["enacted", "議決"],
    ["rejected", "議決"],
  ] as const)("議決済み %s → %s（日付は議決日）", (status, expected) => {
    expect(getBillDateLabel(status)).toBe(expected);
  });

  it.each([
    ["in_originating_house", "継続審議"],
    ["in_receiving_house", "継続審議"],
  ] as const)("継続審議 %s → %s（日付は継続審議にした議決の日）", (status, expected) => {
    expect(getBillDateLabel(status)).toBe(expected);
  });

  it.each([
    ["introduced", "提出"],
    ["preparing", "提出"],
  ] as const)("結果がまだ無い %s → %s（日付は提出日）", (status, expected) => {
    expect(getBillDateLabel(status)).toBe(expected);
  });
});
