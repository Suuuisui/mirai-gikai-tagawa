import { describe, expect, it } from "vitest";
import { sortBillsByTagSections } from "./sort-bills-by-tag-sections";

// テスト用の議案はスコアの数値そのもの（getBillScoreはそのまま返すだけ）で表現し、
// 純粋関数のロジック検証に不要なBillの詳細フィールドを持ち込まない。
const getBillScore = (score: number) => score;

// MIN_NOTABLE_SCORE(50)を明確に超える/超えない値を使い分けてテストの意図を明示する
const NOTABLE_SCORE = 60;
const ANOTHER_NOTABLE_SCORE = 100;
const NORMAL_SCORE = 30;

function createSection(priority: number, billScores: number[]) {
  return { tag: { priority }, bills: billScores };
}

describe("sortBillsByTagSections", () => {
  it("代表スコアが閾値を超えるセクションは、featured_priorityに関わらず常に上位に来る", () => {
    const sections = [
      createSection(5, [NOTABLE_SCORE]), // 優先度は低いが話題性あり
      createSection(0, [NORMAL_SCORE]), // 優先度は高いが話題性なし
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([5, 0]);
  });

  it("閾値を超えないセクション同士は featured_priority の昇順で並ぶ（スコアの大小は無視）", () => {
    const sections = [
      createSection(2, [10]),
      createSection(0, [NORMAL_SCORE]), // スコアは3つの中で最も高いが閾値未満
      createSection(1, [5]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1, 2]);
  });

  it("閾値を超えるセクション同士は代表スコアの降順、同点なら featured_priority 昇順", () => {
    const sections = [
      createSection(2, [NOTABLE_SCORE]),
      createSection(0, [ANOTHER_NOTABLE_SCORE]),
      createSection(1, [NOTABLE_SCORE]), // priority=2のセクションと同点
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1, 2]);
  });

  it("議案が0件のセクションは閾値超え扱いにならず、featured_priority順の並びに合流する", () => {
    const sections = [
      createSection(1, [NORMAL_SCORE]),
      createSection(0, []), // 代表スコアは負の無限大だが、閾値超えではない他セクションと同列
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1]);
  });

  it("セクション内の議案の並び順（先頭が最高スコアとは限らない）に左右されない", () => {
    const sections = [
      createSection(0, [5, 5, ANOTHER_NOTABLE_SCORE]), // 代表スコアは末尾の100
      createSection(1, [NOTABLE_SCORE, 1]),
    ];

    const result = sortBillsByTagSections(sections, getBillScore);

    expect(result.map((s) => s.tag.priority)).toEqual([0, 1]);
  });

  it("元の配列を変更しない", () => {
    const sections = [
      createSection(1, [10]),
      createSection(0, [ANOTHER_NOTABLE_SCORE]),
    ];
    const originalCopy = [...sections];

    sortBillsByTagSections(sections, getBillScore);

    expect(sections).toEqual(originalCopy);
  });
});
