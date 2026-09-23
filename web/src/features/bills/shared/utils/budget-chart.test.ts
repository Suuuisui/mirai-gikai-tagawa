import { describe, expect, it } from "vitest";
import {
  barWidthPercent,
  formatSignedYen,
  formatYen,
  parseBudgetChartSpec,
} from "./budget-chart";

describe("formatYen / formatSignedYen", () => {
  it("億・万・円で読める形にする", () => {
    expect(formatYen(36_704_645_000)).toBe("367億464万5,000円");
    expect(formatYen(395_022_000)).toBe("3億9,502万2,000円");
    expect(formatYen(26_755_000)).toBe("2,675万5,000円");
    expect(formatYen(704_000)).toBe("70万4,000円");
    expect(formatYen(10_000)).toBe("1万円");
    expect(formatYen(1_000)).toBe("1,000円");
    expect(formatYen(100_000_000)).toBe("1億円");
    expect(formatYen(12_345_678_901_234)).toBe("12兆3,456億7,890万1,234円");
    expect(formatYen(0)).toBe("0円");
    expect(formatYen(-0)).toBe("0円");
  });

  it("マイナスは予算書の慣例で △ を付け、増減は ＋ を付ける", () => {
    expect(formatYen(-102_000)).toBe("△10万2,000円");
    expect(formatSignedYen(395_022_000)).toBe("＋3億9,502万2,000円");
    expect(formatSignedYen(-409_216_000)).toBe("△4億921万6,000円");
    expect(formatSignedYen(0)).toBe("0円");
    expect(formatSignedYen(-0)).toBe("0円");
  });
});

describe("parseBudgetChartSpec", () => {
  it("総額と内訳を読み取る（マイナスだけの内訳も可）", () => {
    const spec = parseBudgetChartSpec(
      JSON.stringify({
        title: "一般会計",
        total: { before: 100, change: 5, after: 105 },
        breakdowns: [
          { title: "歳出", items: [{ label: "総務費", amount: 5 }] },
        ],
      })
    );
    expect(spec?.total?.after).toBe(105);
    expect(spec?.breakdowns?.[0].items[0].label).toBe("総務費");
    expect(
      parseBudgetChartSpec(
        JSON.stringify({
          breakdowns: [
            { title: "歳出", items: [{ label: "民生費", amount: -1 }] },
          ],
        })
      )
    ).not.toBeNull();
  });

  it("壊れた JSON・オブジェクトでない・金額が数値でない・中身が空なら null", () => {
    expect(parseBudgetChartSpec("{")).toBeNull();
    expect(parseBudgetChartSpec("[]")).toBeNull();
    expect(parseBudgetChartSpec('"text"')).toBeNull();
    expect(parseBudgetChartSpec("null")).toBeNull();
    expect(
      parseBudgetChartSpec(
        JSON.stringify({ total: { before: "1", change: 0, after: 1 } })
      )
    ).toBeNull();
    expect(
      parseBudgetChartSpec(
        JSON.stringify({ breakdowns: [{ title: "x", items: [] }] })
      )
    ).toBeNull();
    expect(parseBudgetChartSpec(JSON.stringify({ title: "だけ" }))).toBeNull();
    expect(
      parseBudgetChartSpec(
        JSON.stringify({
          total: { before: 1, change: 1, after: 2 },
          breakdowns: [],
        })
      )
    ).not.toBeNull();
    expect(
      parseBudgetChartSpec(
        JSON.stringify({ total: { before: 1.5, change: 0, after: 1.5 } })
      )
    ).toBeNull();
  });

  it("知らないキー（書き間違い）や、補正前＋補正額≠補正後の定義は null", () => {
    expect(
      parseBudgetChartSpec(
        JSON.stringify({ totals: { before: 1, change: 1, after: 2 } })
      )
    ).toBeNull();
    expect(
      parseBudgetChartSpec(
        JSON.stringify({ total: { before: 100, change: 5, after: 106 } })
      )
    ).toBeNull();
  });
});

describe("barWidthPercent", () => {
  it("最大値に対する割合で、0 は 0%、小さい値でも最低 2%、100% を超えない", () => {
    expect(barWidthPercent(50, 100)).toBe(50);
    expect(barWidthPercent(-50, 100)).toBe(50);
    expect(barWidthPercent(1, 1000)).toBe(2);
    expect(barWidthPercent(0, 100)).toBe(0);
    expect(barWidthPercent(10, 0)).toBe(0);
    expect(barWidthPercent(10, -5)).toBe(0);
    expect(barWidthPercent(200, 100)).toBe(100);
  });
});
