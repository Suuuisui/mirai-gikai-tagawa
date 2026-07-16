import { describe, expect, it } from "vitest";
import {
  type BillForInterestScore,
  computeBillInterestScore,
  sortBillsTagRowsByInterestDesc,
} from "./interest-score";

// 実際の呼び出し元（findPublishedBillsByTag）はBillの全カラムを含む重い型を返すが、
// このテストでは純粋関数のロジック検証に必要な最小限のフィールドのみを渡す。
function createBill(
  overrides: Partial<BillForInterestScore> = {}
): BillForInterestScore {
  return {
    status_note: null,
    name: "第1号議案 田川市一般会計補正予算（第1号）",
    is_featured: false,
    explanation_material_urls: null,
    bill_contents: undefined,
    ...overrides,
  };
}

describe("computeBillInterestScore", () => {
  it("加点要素が何もない議案は0点になる", () => {
    expect(computeBillInterestScore(createBill())).toBe(0);
  });

  it("status_note が「否決」を含む場合は+50", () => {
    const score = computeBillInterestScore(createBill({ status_note: "否決" }));
    expect(score).toBe(50);
  });

  it("status_note が「不認定」「継続審議」等でも異例議決として+50", () => {
    expect(
      computeBillInterestScore(createBill({ status_note: "不認定" }))
    ).toBe(50);
    expect(
      computeBillInterestScore(createBill({ status_note: "継続審議" }))
    ).toBe(50);
  });

  it("is_featured が true の場合は+30", () => {
    const score = computeBillInterestScore(createBill({ is_featured: true }));
    expect(score).toBe(30);
  });

  it("content に「反対討論」を含む場合は+25", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: {
          title: "",
          summary: "",
          content: "反対討論が行われた",
        },
      })
    );
    expect(score).toBe(25);
  });

  it("content に「賛成多数」を含む場合も+25", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: { title: "", summary: "", content: "賛成多数で可決" },
      })
    );
    expect(score).toBe(25);
  });

  it("content に「## 議会での主な論点」を含む場合は+15", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: {
          title: "",
          summary: "",
          content: "## 議会での主な論点\n本文",
        },
      })
    );
    expect(score).toBe(15);
  });

  it("name/title に「一般会計予算」を含み「補正」を含まない場合は+10（当初予算）", () => {
    const score = computeBillInterestScore(
      createBill({ name: "第1号議案 田川市一般会計予算" })
    );
    expect(score).toBe(10);
  });

  it("「一般会計予算」を含んでいても「補正」も含む場合は加点しない", () => {
    const score = computeBillInterestScore(
      createBill({ name: "第1号議案 田川市一般会計補正予算（第1号）" })
    );
    expect(score).toBe(0);
  });

  it("name+title+summary に生活密着キーワードを含む場合は+8", () => {
    const score = computeBillInterestScore(
      createBill({
        name: "学校給食センター条例の一部を改正する条例",
      })
    );
    expect(score).toBe(8);
  });

  it("explanation_material_urls が1件以上の配列の場合は+2", () => {
    const score = computeBillInterestScore(
      createBill({
        explanation_material_urls: [
          { label: "説明資料", url: "https://example.com/a.pdf" },
        ],
      })
    );
    expect(score).toBe(2);
  });

  it("explanation_material_urls が空配列や不正な形式の場合は加点しない", () => {
    expect(
      computeBillInterestScore(createBill({ explanation_material_urls: [] }))
    ).toBe(0);
    expect(
      computeBillInterestScore(
        createBill({ explanation_material_urls: [{ foo: "bar" }] })
      )
    ).toBe(0);
  });

  it("name が定型議案パターン（任命・選任など）にマッチする場合は-15", () => {
    expect(
      computeBillInterestScore(
        createBill({
          name: "教育委員会委員の任命につき同意を求めることについて",
        })
      )
    ).toBe(-15);
    expect(
      computeBillInterestScore(
        createBill({ name: "専決処分の承認を求めることについて" })
      )
    ).toBe(-15);
  });

  it("複数の加点・減点ルールが同時に適用される場合は合算される", () => {
    const score = computeBillInterestScore(
      createBill({
        status_note: "否決",
        is_featured: true,
        bill_contents: {
          title: "",
          summary: "",
          content: "反対討論が行われ、## 議会での主な論点\n本文",
        },
      })
    );
    // 50(否決) + 30(featured) + 25(討論) + 15(論点解説)
    expect(score).toBe(120);
  });
});

describe("sortBillsTagRowsByInterestDesc", () => {
  it("スコア降順に並べ替える", () => {
    const result = sortBillsTagRowsByInterestDesc([
      {
        bills: {
          ...createBill(),
          id: "bill-low",
          submitted_date: "2026-01-01",
        },
      },
      {
        bills: {
          ...createBill({ status_note: "否決" }),
          id: "bill-high",
          submitted_date: "2020-01-01",
        },
      },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["bill-high", "bill-low"]);
  });

  it("否決議案が新しい定型議案より上に来る（統合ケース）", () => {
    const rejectedOldBill = {
      bills: {
        ...createBill({
          status_note: "否決",
          name: "工事請負契約の締結について",
        }),
        id: "rejected-old",
        submitted_date: "2015-03-01",
      },
    };
    const routineNewBill = {
      bills: {
        ...createBill({
          name: "教育委員会委員の任命につき同意を求めることについて",
        }),
        id: "routine-new",
        submitted_date: "2026-06-01",
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      routineNewBill,
      rejectedOldBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "rejected-old",
      "routine-new",
    ]);
  });

  it("スコアが同点の場合は submitted_date の新しい順（null末尾）", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: { ...createBill(), id: "b", submitted_date: null } },
      { bills: { ...createBill(), id: "a", submitted_date: "2025-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["a", "b"]);
  });

  it("スコアも日付も同点の場合は id の昇順で安定化する", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: { ...createBill(), id: "b", submitted_date: "2025-01-01" } },
      { bills: { ...createBill(), id: "a", submitted_date: "2025-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["a", "b"]);
  });

  it("bills が null の行は末尾に回す", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: null },
      { bills: { ...createBill(), id: "a", submitted_date: "2020-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.id ?? null)).toEqual(["a", null]);
  });

  it("元の配列を変更しない", () => {
    const original = [
      { bills: { ...createBill(), id: "b", submitted_date: "2020-01-01" } },
      { bills: { ...createBill(), id: "a", submitted_date: "2025-01-01" } },
    ];
    const originalCopy = [...original];

    sortBillsTagRowsByInterestDesc(original);

    expect(original).toEqual(originalCopy);
  });
});
