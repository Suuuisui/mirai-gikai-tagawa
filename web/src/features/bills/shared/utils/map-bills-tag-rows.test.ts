import { describe, expect, it } from "vitest";
import {
  mapBillsTagRowsToBills,
  sortBillsTagRowsByDateDesc,
} from "./map-bills-tag-rows";

// 実際の呼び出し元（findPublishedBillsByTag）はBillの全カラムを含む重い型を返すが、
// このテストでは純粋関数のロジック検証に必要な最小限のフィールドのみを渡す。
type Rows = Parameters<typeof mapBillsTagRowsToBills>[0];

describe("mapBillsTagRowsToBills", () => {
  it("空配列のとき空配列を返す", () => {
    const result = mapBillsTagRowsToBills([]);
    expect(result).toEqual([]);
  });

  it("bills=null のエントリは除外する", () => {
    const result = mapBillsTagRowsToBills([{ bills: null }] as unknown as Rows);
    expect(result).toEqual([]);
  });

  it("bill_contents が配列の場合は先頭要素を bill_content として取り出す", () => {
    const result = mapBillsTagRowsToBills([
      {
        bills: {
          id: "bill-1",
          name: "第1号議案",
          bill_contents: [{ id: "content-1", title: "タイトル" }],
          bills_tags: [],
        },
      },
    ] as unknown as Rows);

    expect(result).toHaveLength(1);
    expect(result[0].bill_content).toEqual({
      id: "content-1",
      title: "タイトル",
    });
    expect(result[0].id).toBe("bill-1");
  });

  it("bills_tags からタグ一覧を抽出し、null タグは除外する", () => {
    const result = mapBillsTagRowsToBills([
      {
        bills: {
          id: "bill-1",
          name: "第1号議案",
          bill_contents: [],
          bills_tags: [
            { tags: { id: "tag-1", label: "予算" } },
            { tags: null },
            { tags: { id: "tag-2", label: "条例" } },
          ],
        },
      },
    ] as unknown as Rows);

    expect(result[0].tags).toEqual([
      { id: "tag-1", label: "予算" },
      { id: "tag-2", label: "条例" },
    ]);
  });

  it("bills_tags が未定義の場合は空配列を tags とする", () => {
    const result = mapBillsTagRowsToBills([
      {
        bills: {
          id: "bill-1",
          name: "第1号議案",
        },
      },
    ] as unknown as Rows);

    expect(result[0].tags).toEqual([]);
    expect(result[0].bill_content).toBeUndefined();
  });

  it("複数行を一括で整形する", () => {
    const result = mapBillsTagRowsToBills([
      { bills: { id: "bill-1", name: "第1号議案", bills_tags: [] } },
      { bills: null },
      { bills: { id: "bill-2", name: "第2号議案", bills_tags: [] } },
    ] as unknown as Rows);

    expect(result.map((b) => b.id)).toEqual(["bill-1", "bill-2"]);
  });
});

describe("sortBillsTagRowsByDateDesc", () => {
  it("submitted_date の新しい順に並べ替える", () => {
    const result = sortBillsTagRowsByDateDesc([
      { bills: { submitted_date: "2021-03-01" } },
      { bills: { submitted_date: "2026-06-01" } },
      { bills: { submitted_date: "2024-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.submitted_date)).toEqual([
      "2026-06-01",
      "2024-01-01",
      "2021-03-01",
    ]);
  });

  it("submitted_date が null の行は末尾に回す", () => {
    const result = sortBillsTagRowsByDateDesc([
      { bills: { submitted_date: null } },
      { bills: { submitted_date: "2025-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.submitted_date)).toEqual([
      "2025-01-01",
      null,
    ]);
  });

  it("bills が null の行も末尾に回す", () => {
    const result = sortBillsTagRowsByDateDesc([
      { bills: null },
      { bills: { submitted_date: "2025-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.submitted_date ?? null)).toEqual([
      "2025-01-01",
      null,
    ]);
  });

  it("元の配列を変更しない", () => {
    const original = [
      { bills: { submitted_date: "2021-03-01" } },
      { bills: { submitted_date: "2026-06-01" } },
    ];
    const originalCopy = [...original];

    sortBillsTagRowsByDateDesc(original);

    expect(original).toEqual(originalCopy);
  });
});
