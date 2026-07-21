import { describe, expect, it } from "vitest";
import { findAdjacentBills } from "./adjacent-bills";

type TestBill = { id: string };

function makeBill(id: string): TestBill {
  return { id };
}

describe("findAdjacentBills", () => {
  it("中間の議案は前後どちらも返す", () => {
    const bills = [makeBill("a"), makeBill("b"), makeBill("c")];

    const result = findAdjacentBills(bills, "b");

    expect(result.previous?.id).toBe("a");
    expect(result.next?.id).toBe("c");
  });

  it("先頭の議案はpreviousがnull", () => {
    const bills = [makeBill("a"), makeBill("b"), makeBill("c")];

    const result = findAdjacentBills(bills, "a");

    expect(result.previous).toBeNull();
    expect(result.next?.id).toBe("b");
  });

  it("末尾の議案はnextがnull", () => {
    const bills = [makeBill("a"), makeBill("b"), makeBill("c")];

    const result = findAdjacentBills(bills, "c");

    expect(result.previous?.id).toBe("b");
    expect(result.next).toBeNull();
  });

  it("currentIdが存在しない場合はどちらもnull", () => {
    const bills = [makeBill("a"), makeBill("b")];

    const result = findAdjacentBills(bills, "missing");

    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });

  it("要素が1件のみの場合はprevious/nextとも null", () => {
    const bills = [makeBill("a")];

    const result = findAdjacentBills(bills, "a");

    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });
});
