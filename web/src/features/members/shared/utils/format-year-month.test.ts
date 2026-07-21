import { describe, expect, it } from "vitest";
import { formatYearMonth } from "./format-year-month";

describe("formatYearMonth", () => {
  it("YYYY-MM-DD をYYYY年M月表記にする（月の先頭ゼロは除く）", () => {
    expect(formatYearMonth("2021-03-26")).toBe("2021年3月");
    expect(formatYearMonth("2026-12-01")).toBe("2026年12月");
  });

  it("想定外の形式は入力をそのまま返す", () => {
    expect(formatYearMonth("2021年")).toBe("2021年");
    expect(formatYearMonth("")).toBe("");
  });
});
