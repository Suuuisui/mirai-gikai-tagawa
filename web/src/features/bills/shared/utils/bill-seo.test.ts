import { describe, expect, it } from "vitest";
import type { BillWithContent } from "../types";
import {
  buildBillMetaDescription,
  buildBillPageTitle,
  truncateForSnippet,
} from "./bill-seo";

function makeBill(overrides: {
  name?: string;
  title?: string | null;
  summary?: string | null;
}): BillWithContent {
  return {
    name: overrides.name ?? "議案第1号",
    bill_content:
      overrides.title === undefined && overrides.summary === undefined
        ? null
        : {
            title: overrides.title ?? null,
            summary: overrides.summary ?? null,
          },
  } as unknown as BillWithContent;
}

describe("truncateForSnippet", () => {
  it("上限以内の文字列はそのまま返す", () => {
    expect(truncateForSnippet("短い文章", 10)).toBe("短い文章");
  });

  it("上限を超える文字列は上限内に切り詰めて…を付ける", () => {
    const result = truncateForSnippet("あ".repeat(200), 160);
    expect(Array.from(result).length).toBe(160);
    expect(result.endsWith("…")).toBe(true);
  });

  it("ちょうど上限の文字列は切り詰めない", () => {
    const text = "あ".repeat(160);
    expect(truncateForSnippet(text, 160)).toBe(text);
  });

  it("サロゲートペアを分断しない", () => {
    const result = truncateForSnippet("𩸽".repeat(10), 5);
    expect(Array.from(result).length).toBe(5);
    expect(result).toBe(`${"𩸽".repeat(4)}…`);
  });
});

describe("buildBillPageTitle", () => {
  it("やさしい見出しがあればそれを使う", () => {
    const bill = makeBill({
      name: "議案第59号",
      title: "ゴミ屋敷対策の条例が新設されます",
    });
    expect(buildBillPageTitle(bill)).toBe("ゴミ屋敷対策の条例が新設されます");
  });

  it("見出し未整備なら正式議案名にフォールバックする", () => {
    expect(buildBillPageTitle(makeBill({ name: "議案第59号" }))).toBe(
      "議案第59号"
    );
    expect(
      buildBillPageTitle(makeBill({ name: "議案第59号", title: "" }))
    ).toBe("議案第59号");
  });
});

describe("buildBillMetaDescription", () => {
  it("正式議案名を先頭に置き、要約を続ける", () => {
    const bill = makeBill({
      name: "議案第59号",
      title: "見出し",
      summary: "空き家のうち危険な状態のものを市が指導できるようになります。",
    });
    const result = buildBillMetaDescription(bill);
    expect(
      result.startsWith("田川市議会に提出された「議案第59号」の解説。")
    ).toBe(true);
    expect(result).toContain("空き家のうち危険な状態のもの");
  });

  it("全体が160文字以内に収まる", () => {
    const bill = makeBill({
      name: "議案第59号",
      title: "見出し",
      summary: "長".repeat(300),
    });
    expect(
      Array.from(buildBillMetaDescription(bill)).length
    ).toBeLessThanOrEqual(160);
  });

  it("要約が無い議案は定型文で補う", () => {
    const result = buildBillMetaDescription(makeBill({ name: "議案第59号" }));
    expect(result).toBe(
      "田川市議会に提出された「議案第59号」の解説。提出日・審議状況・議決結果をやさしくまとめています。"
    );
  });
});
