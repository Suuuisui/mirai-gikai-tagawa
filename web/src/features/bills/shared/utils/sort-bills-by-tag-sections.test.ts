import { describe, expect, it } from "vitest";
import { sortBillsByTagSections } from "./sort-bills-by-tag-sections";

// テスト用の議案は { score, hot } という最小限の形で表現し、
// 純粋関数のロジック検証に不要なBillの詳細フィールドを持ち込まない。
// getBillScore はそのままscoreを返し、isHotBill はそのままhotを返す。
type TestBill = { score: number; hot: boolean };
const getBillScore = (bill: TestBill) => bill.score;
const isHotBill = (bill: TestBill) => bill.hot;

function bill(score: number, hot = false): TestBill {
  return { score, hot };
}

function createSection(priority: number, bills: TestBill[]) {
  return { tag: { priority }, bills };
}

describe("sortBillsByTagSections", () => {
  it("話題議案(isHotBillがtrue)を含むセクションは、featured_priorityに関わらず常に上位に来る", () => {
    const sections = [
      createSection(5, [bill(10, true)]), // 優先度は低いが話題性あり
      createSection(0, [bill(30, false)]), // 優先度は高いが話題性なし
    ];

    const result = sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(result.map((s) => s.tag.priority)).toEqual([5, 0]);
  });

  it("話題議案を含まないセクション同士は featured_priority の昇順で並ぶ（スコアの大小は無視）", () => {
    const sections = [
      createSection(2, [bill(10)]),
      createSection(0, [bill(100)]), // スコアは3つの中で最も高いが話題性なし
      createSection(1, [bill(5)]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1, 2]);
  });

  it("話題議案を含むセクション同士は代表スコアの降順、同点なら featured_priority 昇順", () => {
    const sections = [
      createSection(2, [bill(60, true)]),
      createSection(0, [bill(100, true)]),
      createSection(1, [bill(60, true)]), // priority=2のセクションと同点
    ];

    const result = sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1, 2]);
  });

  it("議案が0件のセクションは非話題グループのfeatured_priority順の並びに合流する", () => {
    const sections = [
      createSection(1, [bill(30)]),
      createSection(0, []), // 代表スコアは負の無限大だが、非話題の他セクションと同列
    ];

    const result = sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1]);
  });

  it("セクション内の議案の並び順（先頭が最高スコア・最初のhotとは限らない）に左右されない", () => {
    const sections = [
      createSection(0, [bill(5), bill(5), bill(100, true)]), // 代表スコアは末尾の100、hotも末尾
      createSection(1, [bill(60, true), bill(1)]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1]);
  });

  it("元の配列を変更しない", () => {
    const sections = [
      createSection(1, [bill(10)]),
      createSection(0, [bill(100, true)]),
    ];
    const originalCopy = [...sections];

    sortBillsByTagSections(sections, getBillScore, isHotBill);

    expect(sections).toEqual(originalCopy);
  });
});
