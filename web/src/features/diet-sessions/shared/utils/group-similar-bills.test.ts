import { describe, expect, it } from "vitest";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  GROUP_MIN_COUNT,
  getBaseTitle,
  groupSimilarBills,
} from "./group-similar-bills";

/** テストに必要なフィールドだけを持つ議案を作る */
function makeBill(id: string, title: string): BillWithContent {
  return {
    id,
    name: title,
    bill_content: { title },
  } as unknown as BillWithContent;
}

describe("getBaseTitle", () => {
  it("末尾の括弧書きを除去する", () => {
    expect(
      getBaseTitle("田川市農業委員会委員の任命について（野中 栄藏 氏）")
    ).toBe("田川市農業委員会委員の任命について");
  });

  it("括弧書きが無ければそのまま返す", () => {
    expect(getBaseTitle("田川市市税条例の一部改正について")).toBe(
      "田川市市税条例の一部改正について"
    );
  });

  it("文中の括弧は除去しない", () => {
    expect(getBaseTitle("工事請負契約の変更について（A工区）の報告")).toBe(
      "工事請負契約の変更について（A工区）の報告"
    );
  });
});

describe("groupSimilarBills", () => {
  it("同型議案がしきい値以上連続したらグループにする", () => {
    const bills = [
      makeBill("a", "予算案"),
      makeBill("b", "委員の任命について（甲 氏）"),
      makeBill("c", "委員の任命について（乙 氏）"),
      makeBill("d", "委員の任命について（丙 氏）"),
      makeBill("e", "条例案"),
    ];

    const items = groupSimilarBills(bills);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ type: "single" });
    expect(items[1]).toMatchObject({
      type: "group",
      baseTitle: "委員の任命について",
    });
    expect(
      items[1].type === "group" ? items[1].bills.map((b) => b.id) : []
    ).toEqual(["b", "c", "d"]);
    expect(items[2]).toMatchObject({ type: "single" });
  });

  it("しきい値未満の連続はグループにしない", () => {
    const bills = Array.from({ length: GROUP_MIN_COUNT - 1 }, (_, i) =>
      makeBill(`id-${i}`, `委員の任命について（${i} 氏）`)
    );
    const items = groupSimilarBills(bills);
    expect(items.every((item) => item.type === "single")).toBe(true);
  });

  it("括弧書きの無い同名議案はグループにしない", () => {
    const bills = [
      makeBill("a", "報告について"),
      makeBill("b", "報告について"),
      makeBill("c", "報告について"),
    ];
    const items = groupSimilarBills(bills);
    expect(items.every((item) => item.type === "single")).toBe(true);
  });

  it("空リストは空のまま返す", () => {
    expect(groupSimilarBills([])).toEqual([]);
  });
});
