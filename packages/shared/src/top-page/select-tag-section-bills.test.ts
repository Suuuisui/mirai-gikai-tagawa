import { describe, expect, it } from "vitest";
import type { BillForInterestScore } from "./interest-score";
import { selectTagSectionBills } from "./select-tag-section-bills";

/** 実行時点から指定日数前の日付文字列（YYYY-MM-DD）を返す */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function row(
  id: string,
  overrides: Partial<BillForInterestScore> = {}
): { bills: BillForInterestScore & { id: string } } {
  return {
    bills: {
      id,
      name: `議案 ${id}`,
      status_note: null,
      is_featured: false,
      explanation_material_urls: null,
      submitted_date: daysAgo(30),
      bill_contents: null,
      ...overrides,
    },
  };
}

describe("selectTagSectionBills", () => {
  it("除外IDに含まれる議案（注目の議案）は選定から外れ、除外後にlimitが適用される", () => {
    const rows = [row("a"), row("b"), row("c"), row("d")];
    const result = selectTagSectionBills(rows, new Set(["a", "b"]), 2);
    expect(result.map((r) => r.bills.id).sort()).toEqual(["c", "d"]);
  });

  it("興味度スコアの高い議案（否決など）が上位に来る", () => {
    const rows = [
      row("plain"),
      row("rejected", { status_note: "否決" }),
    ];
    const result = selectTagSectionBills(rows, new Set(), 1);
    expect(result[0]?.bills.id).toBe("rejected");
  });

  it("limit省略時は除外後の全件を返す", () => {
    const rows = [row("a"), row("b"), row("c")];
    const result = selectTagSectionBills(rows, new Set(["b"]));
    expect(result).toHaveLength(2);
  });
});
