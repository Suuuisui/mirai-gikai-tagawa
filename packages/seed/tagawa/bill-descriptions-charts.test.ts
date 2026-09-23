import { describe, expect, it } from "vitest";
import { BILL_DESCRIPTIONS } from "./bill-descriptions";
import { BATCH_B_OVERRIDES } from "./bill-descriptions-batch-b";
import { BATCH_C_OVERRIDES } from "./bill-descriptions-batch-c";
import { BATCH_D_OVERRIDES } from "./bill-descriptions-batch-d";
import { BATCH_E_OVERRIDES } from "./bill-descriptions-batch-e";
import { BATCH_F_OVERRIDES } from "./bill-descriptions-batch-f";

interface ChartTotal {
  before: number;
  change: number;
  after: number;
}

interface Chart {
  total?: ChartTotal;
  breakdowns?: Array<{ title: string; items: Array<{ label: string; amount: number }> }>;
}

/** 解説文の ```budget-chart ブロックを取り出す（web 側 rehype-budget-chart.ts と同じ書式） */
function extractCharts(body: string): Array<{ raw: string; chart: Chart }> {
  return Array.from(body.matchAll(/```budget-chart\n([\s\S]*?)\n```/g), (m) => ({
    raw: m[1],
    chart: JSON.parse(m[1]) as Chart,
  }));
}

const allDescriptions = {
  ...BILL_DESCRIPTIONS,
  ...BATCH_B_OVERRIDES,
  ...BATCH_C_OVERRIDES,
  ...BATCH_D_OVERRIDES,
  ...BATCH_E_OVERRIDES,
  ...BATCH_F_OVERRIDES,
};

const charts = Object.entries(allDescriptions).flatMap(([key, description]) =>
  extractCharts(description.body).map((c) => ({ key, ...c }))
);

describe("解説文の予算の図解（```budget-chart）", () => {
  it("令和8年9月定例会の補正予算5件に図がある", () => {
    const keys = charts.map((c) => c.key);
    for (const label of ["議案第50号", "議案第51号", "議案第52号", "議案第53号", "議案第54号"]) {
      expect(keys.some((key) => key.startsWith(`r8-6-teirei:${label}:`))).toBe(true);
    }
  });

  it("補正前＋補正額＝補正後で、内訳の合計は補正額と一致する（書き写しの誤りを防ぐ）", () => {
    expect(charts.length).toBeGreaterThan(0);
    for (const { key, chart } of charts) {
      if (chart.total) {
        expect(chart.total.before + chart.total.change, key).toBe(chart.total.after);
      }
      for (const breakdown of chart.breakdowns ?? []) {
        const sum = breakdown.items.reduce((acc, item) => acc + item.amount, 0);
        expect(sum, `${key} / ${breakdown.title}`).toBe(chart.total?.change ?? sum);
      }
    }
  });
});
