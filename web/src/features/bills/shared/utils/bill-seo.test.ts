import { describe, expect, it } from "vitest";
import type { BillWithContent } from "../types";
import {
  buildBillMetaDescription,
  buildBillPageTitle,
  buildBillSearchTitle,
  extractBillNumber,
  findDuplicateBillTitles,
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

describe("extractBillNumber", () => {
  it("議案名の先頭の議案番号を取り出す", () => {
    expect(
      extractBillNumber("議案第1号　令和3年度田川市一般会計補正予算")
    ).toBe("議案第1号");
    expect(
      extractBillNumber(
        "議員提出議案第65号　非核三原則の堅持を求める意見書について"
      )
    ).toBe("議員提出議案第65号");
    expect(extractBillNumber("認定第1号　令和7年度田川市一般会計決算")).toBe(
      "認定第1号"
    );
  });

  it("全角数字の番号も取り出す", () => {
    expect(extractBillNumber("議案第１２号　財産の取得について")).toBe(
      "議案第１２号"
    );
  });

  it("先頭に番号が無い議案名は null（名前の途中の「第N号」は拾わない）", () => {
    expect(
      extractBillNumber(
        "陸田孝則議員の公職選挙法に関する検証等特別委員会の審査結果報告について"
      )
    ).toBeNull();
    expect(extractBillNumber("田川市条例第5号の一部改正について")).toBeNull();
  });
});

describe("findDuplicateBillTitles", () => {
  it("同じ題名の議案が 2 件以上ある題名だけを集める", () => {
    const titles = findDuplicateBillTitles([
      makeBill({
        name: "議案第1号　令和3年度田川市一般会計補正予算",
        title: "令和3年度田川市一般会計補正予算",
      }),
      makeBill({
        name: "議案第79号　令和3年度田川市一般会計補正予算",
        title: "令和3年度田川市一般会計補正予算",
      }),
      makeBill({
        name: "議案第2号　財産の取得について",
        title: "財産の取得について",
      }),
    ]);
    expect([...titles]).toEqual(["令和3年度田川市一般会計補正予算"]);
  });

  it("やさしい見出しが無い議案は議案名で数える", () => {
    const titles = findDuplicateBillTitles([
      makeBill({ name: "議案第1号" }),
      makeBill({ name: "議案第1号" }),
    ]);
    expect(titles.has("議案第1号")).toBe(true);
  });

  it("重なる題名が無ければ空", () => {
    expect(
      findDuplicateBillTitles([
        makeBill({ name: "議案第1号", title: "A" }),
        makeBill({ name: "議案第2号", title: "B" }),
      ]).size
    ).toBe(0);
  });
});

describe("buildBillSearchTitle", () => {
  const duplicates = new Set(["令和3年度田川市一般会計補正予算"]);
  const base = {
    name: "議案第1号　令和3年度田川市一般会計補正予算",
    bill_content: { title: "令和3年度田川市一般会計補正予算" },
    status: "enacted" as const,
    submitted_date: "2021-03-19",
  };

  it("題名が他の議案と重なるときは、議案番号と議決日（和暦）を添える", () => {
    expect(buildBillSearchTitle(base, duplicates)).toBe(
      "令和3年度田川市一般会計補正予算（議案第1号・令和3年3月19日議決）"
    );
  });

  it("審議中の議案は「提出」、継続審議は「継続審議」と、見出しと同じ呼び方にする", () => {
    expect(
      buildBillSearchTitle({ ...base, status: "introduced" }, duplicates)
    ).toContain("令和3年3月19日提出");
    expect(
      buildBillSearchTitle(
        { ...base, status: "in_originating_house" },
        duplicates
      )
    ).toContain("令和3年3月19日継続審議");
  });

  it("題名が重ならない議案は、題名だけ", () => {
    expect(buildBillSearchTitle(base, new Set())).toBe(
      "令和3年度田川市一般会計補正予算"
    );
  });

  it("議案番号か日付のどちらかが無ければ、ある方だけ添える", () => {
    expect(
      buildBillSearchTitle({ ...base, submitted_date: null }, duplicates)
    ).toBe("令和3年度田川市一般会計補正予算（議案第1号）");
    expect(
      buildBillSearchTitle(
        {
          ...base,
          name: "議案番号のない名前",
          bill_content: { title: "令和3年度田川市一般会計補正予算" },
        },
        duplicates
      )
    ).toBe("令和3年度田川市一般会計補正予算（令和3年3月19日議決）");
  });

  it("どちらも無ければ題名だけ", () => {
    expect(
      buildBillSearchTitle(
        { ...base, name: "番号なし", submitted_date: null },
        duplicates
      )
    ).toBe("令和3年度田川市一般会計補正予算");
  });

  it("同じ題名・同じ番号でも日付が違えば、題名が違う（会期をまたぐ議案番号の重複）", () => {
    const a = buildBillSearchTitle(base, duplicates);
    const b = buildBillSearchTitle(
      { ...base, submitted_date: "2021-06-18" },
      duplicates
    );
    expect(a).not.toBe(b);
  });
});
