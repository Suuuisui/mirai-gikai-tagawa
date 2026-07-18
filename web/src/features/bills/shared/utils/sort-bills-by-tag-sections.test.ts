import { describe, expect, it } from "vitest";
import { sortBillsByTagSections } from "./sort-bills-by-tag-sections";

// テスト用の議案はスコアの数値そのもの（getBillScoreはそのまま返すだけ）で表現し、
// 純粋関数のロジック検証に不要なBillの詳細フィールドを持ち込まない。
const getBillScore = (score: number) => score;

function createSection(priority: number, billScores: number[]) {
  return { tag: { priority }, bills: billScores };
}

describe("sortBillsByTagSections", () => {
  it("代表スコア（セクション内最大値）の降順に並べ替える", () => {
    const sections = [
      createSection(0, [10, 5]), // 代表スコア10
      createSection(1, [50, 20]), // 代表スコア50
      createSection(2, [30]), // 代表スコア30
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([1, 2, 0]);
  });

  it("代表スコアが同点の場合は featured_priority の昇順にフォールバックする", () => {
    const sections = [
      createSection(2, [10]),
      createSection(0, [10]),
      createSection(1, [10]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1, 2]);
  });

  it("議案が0件のセクションは代表スコアが最低扱いとなり末尾に回る", () => {
    const sections = [
      createSection(0, []),
      createSection(1, [1]),
      createSection(2, [100]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([2, 1, 0]);
  });

  it("セクション内の議案の並び順（先頭が最高スコアとは限らない）に左右されない", () => {
    const sections = [
      createSection(0, [5, 5, 100]), // 代表スコアは末尾の100
      createSection(1, [50, 1]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1]);
  });

  it("元の配列を変更しない", () => {
    const sections = [createSection(1, [1]), createSection(0, [100])];
    const originalCopy = [...sections];

    sortBillsByTagSections(sections, getBillScore);

    expect(sections).toEqual(originalCopy);
  });
});
