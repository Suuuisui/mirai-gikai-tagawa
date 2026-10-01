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
