import { describe, expect, it } from "vitest";
import { formatJapaneseEraDate } from "./japanese-era";

describe("formatJapaneseEraDate", () => {
  it("令和の日付を和暦にする", () => {
    expect(formatJapaneseEraDate("2026-10-08")).toBe("令和8年10月8日");
    expect(formatJapaneseEraDate("2021-01-21")).toBe("令和3年1月21日");
  });

  it("元号の切り替わりの日付を正しく判定する", () => {
    expect(formatJapaneseEraDate("2019-04-30")).toBe("平成31年4月30日");
    expect(formatJapaneseEraDate("2019-05-01")).toBe("令和元年5月1日");
    expect(formatJapaneseEraDate("1989-01-07")).toBe("昭和64年1月7日");
    expect(formatJapaneseEraDate("1989-01-08")).toBe("平成元年1月8日");
  });

  it("元年の翌年から「元」が外れる（令和2年は 2020 年）", () => {
    expect(formatJapaneseEraDate("2019-12-31")).toBe("令和元年12月31日");
    expect(formatJapaneseEraDate("2020-01-01")).toBe("令和2年1月1日");
  });

  it("昭和の起点は 1926-12-25（昭和元年）で、前日は昭和より前なので null", () => {
    expect(formatJapaneseEraDate("1926-12-25")).toBe("昭和元年12月25日");
    expect(formatJapaneseEraDate("1926-12-24")).toBeNull();
  });

  it("月・日のゼロ埋めを外す", () => {
    expect(formatJapaneseEraDate("2025-03-04")).toBe("令和7年3月4日");
  });

  it("時刻付きの文字列は日付の部分だけを使う", () => {
    expect(formatJapaneseEraDate("2026-10-08T15:00:00.000Z")).toBe(
      "令和8年10月8日"
    );
  });

  it("日付として読めない入力と昭和より前の日付は null", () => {
    expect(formatJapaneseEraDate("")).toBeNull();
    expect(formatJapaneseEraDate("2026/10/08")).toBeNull();
    expect(formatJapaneseEraDate("2026-13-01")).toBeNull();
    expect(formatJapaneseEraDate("2026-10-00")).toBeNull();
    expect(formatJapaneseEraDate("1900-01-01")).toBeNull();
  });
});
