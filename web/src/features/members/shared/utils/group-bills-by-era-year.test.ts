import { describe, expect, it } from "vitest";
import {
  groupBillsByEraYear,
  UNKNOWN_ERA_YEAR_LABEL,
} from "./group-bills-by-era-year";

type TestBill = { id: string; submitted_date: string | null };

function makeBill(id: string, submitted_date: string | null): TestBill {
  return { id, submitted_date };
}

describe("groupBillsByEraYear", () => {
  it("submitted_dateの和暦年でグルーピングする", () => {
    const bills = [
      makeBill("1", "2026-06-12"), // 令和8年
      makeBill("2", "2026-01-10"), // 令和8年
      makeBill("3", "2025-12-01"), // 令和7年
    ];

    const groups = groupBillsByEraYear(bills);

    expect(groups).toEqual([
      { label: "令和8年", bills: [bills[0], bills[1]] },
      { label: "令和7年", bills: [bills[2]] },
    ]);
  });

  it("グループ内の並び順（入力順）を維持する", () => {
    const bills = [
      makeBill("1", "2025-12-01"),
      makeBill("2", "2025-09-01"),
      makeBill("3", "2025-07-01"),
    ];

    const groups = groupBillsByEraYear(bills);

    expect(groups).toHaveLength(1);
    expect(groups[0].bills.map((b) => b.id)).toEqual(["1", "2", "3"]);
  });

  it("同じラベルの議案が離れて出現しても同一グループにまとめる", () => {
    const bills = [
      makeBill("1", "2024-12-01"), // 令和6年
      makeBill("2", "2025-03-01"), // 令和7年
      makeBill("3", "2024-06-01"), // 令和6年
    ];

    const groups = groupBillsByEraYear(bills);

    expect(groups.map((g) => g.label)).toEqual(["令和6年", "令和7年"]);
    expect(groups[0].bills.map((b) => b.id)).toEqual(["1", "3"]);
  });

  it("令和元年（2019年5月1日〜12月31日）を「令和元年」と表記する", () => {
    const bills = [makeBill("1", "2019-05-01"), makeBill("2", "2019-12-31")];

    const groups = groupBillsByEraYear(bills);

    expect(groups).toEqual([
      { label: "令和元年", bills: [bills[0], bills[1]] },
    ]);
  });

  it("平成の日付は平成年でグルーピングする（令和への切り替わり境界を含む）", () => {
    const bills = [
      makeBill("1", "2019-04-30"), // 平成31年（令和開始前日）
      makeBill("2", "1998-04-01"), // 平成10年
    ];

    const groups = groupBillsByEraYear(bills);

    expect(groups).toEqual([
      { label: "平成31年", bills: [bills[0]] },
      { label: "平成10年", bills: [bills[1]] },
    ]);
  });

  it("submitted_dateがnullの議案は「提出日不明」グループにまとめる", () => {
    const bills = [makeBill("1", "2025-01-01"), makeBill("2", null)];

    const groups = groupBillsByEraYear(bills);

    expect(groups).toEqual([
      { label: "令和7年", bills: [bills[0]] },
      { label: UNKNOWN_ERA_YEAR_LABEL, bills: [bills[1]] },
    ]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(groupBillsByEraYear([])).toEqual([]);
  });
});
