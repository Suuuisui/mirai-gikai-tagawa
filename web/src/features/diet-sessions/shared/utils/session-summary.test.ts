import { describe, expect, it } from "vitest";
import type { BillWithContent } from "@/features/bills/shared/types";
import type { DietSessionNavItem } from "../types";
import {
  findAdjacentSessions,
  pickSessionHighlights,
  summarizeSessionResults,
} from "./session-summary";

// biome-ignore lint/suspicious/noExplicitAny: テスト用の最小限のダミーデータ生成のため
function makeBill(overrides: Record<string, any> = {}): any {
  return {
    id: overrides.id ?? "00000000-0000-0000-0000-000000000000",
    status: overrides.status ?? "enacted",
    status_note: overrides.status_note ?? "原案可決",
    member_votes: overrides.member_votes ?? null,
    ...overrides,
  };
}

describe("summarizeSessionResults", () => {
  it("可決系のstatus_noteを passed に分類する", () => {
    const bills = [
      makeBill({ status_note: "原案可決" }),
      makeBill({ status_note: "同意" }),
      makeBill({ status_note: "承認" }),
      makeBill({ status_note: "認定" }),
      makeBill({ status_note: "採択" }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.passed).toBe(5);
    expect(result.rejected).toBe(0);
    expect(result.other).toBe(0);
    expect(result.total).toBe(5);
  });

  it("否決系のstatus_noteを rejected に分類する（「不認定」「不採択」を可決と誤判定しない）", () => {
    const bills = [
      makeBill({ status: "rejected", status_note: "否決" }),
      makeBill({ status: "rejected", status_note: "不認定" }),
      makeBill({ status: "rejected", status_note: "不採択" }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.rejected).toBe(3);
    expect(result.passed).toBe(0);
  });

  it("継続審議・懲罰等、可決/否決のどちらでもないものは other に分類する", () => {
    const bills = [
      makeBill({ status: "in_originating_house", status_note: "継続審議" }),
      makeBill({ status: "enacted", status_note: "懲罰を科す(陳謝)" }),
      makeBill({ status: "enacted", status_note: "修正議決" }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.other).toBe(3);
    expect(result.passed).toBe(0);
    expect(result.rejected).toBe(0);
  });

  it("status_noteがnullの場合はstatusにフォールバックする", () => {
    const bills = [
      makeBill({ status: "enacted", status_note: null }),
      makeBill({ status: "rejected", status_note: null }),
      makeBill({ status: "introduced", status_note: null }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.passed).toBe(1);
    expect(result.rejected).toBe(1);
    expect(result.other).toBe(1);
  });

  it("審議中の議案（status_noteに審議中）はその他に数える", () => {
    const bills = [
      makeBill({
        status: "introduced",
        status_note: "審議中（9月29日の本会議で採決予定）",
      }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.passed).toBe(0);
    expect(result.rejected).toBe(0);
    expect(result.other).toBe(1);
  });

  it("本会議で議決前の議案は、委員会の結論が status_note にあっても可決・否決に数えない", () => {
    const bills = [
      makeBill({
        status: "introduced",
        status_note:
          "10月1日の厚生委員会で異議なく認定と決定（10月8日の本会議で採決予定）",
      }),
      makeBill({
        status: "introduced",
        status_note:
          "常任委員会で審査中（9月30日の総務文教委員会は所管分を賛成少数で不認定と決定）",
      }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.passed).toBe(0);
    expect(result.rejected).toBe(0);
    expect(result.other).toBe(2);
  });

  it("member_votesが非nullの件数をsplitCountとして数える", () => {
    const bills = [
      makeBill({ member_votes: { entries: [] } }),
      makeBill({ member_votes: null }),
      makeBill({ member_votes: { entries: [] } }),
    ];

    const result = summarizeSessionResults(bills);

    expect(result.splitCount).toBe(2);
  });

  it("空配列では全て0を返す", () => {
    const result = summarizeSessionResults([]);

    expect(result).toEqual({
      total: 0,
      passed: 0,
      rejected: 0,
      other: 0,
      splitCount: 0,
    });
  });
});

describe("pickSessionHighlights", () => {
  // 解説の定型で入る見出しと語（反対討論 +25・議会での主な論点 +15）
  const TEMPLATE_CONTENT = "反対討論があった。\n## 議会での主な論点\n詳細";

  function makeBillWithContent(
    overrides: Partial<BillWithContent> = {}
  ): BillWithContent {
    return {
      id: overrides.id ?? "bill-1",
      name: overrides.name ?? "テスト議案",
      status: overrides.status ?? "enacted",
      status_note: overrides.status_note ?? "原案可決",
      is_featured: overrides.is_featured ?? false,
      explanation_material_urls: overrides.explanation_material_urls ?? null,
      submitted_date: overrides.submitted_date ?? "2026-06-01",
      member_votes: overrides.member_votes ?? null,
      tags: overrides.tags ?? [],
      bill_content: overrides.bill_content,
      // biome-ignore lint/suspicious/noExplicitAny: テスト用ダミーのため型を緩める
    } as any;
  }

  function withContent(content: string) {
    // biome-ignore lint/suspicious/noExplicitAny: テスト用ダミーのため型を緩める
    return { title: "", summary: "", content } as any;
  }

  it("否決など異例の議決があった議案と、中身の点数が閾値を超える議案を、点数の高い順に上位N件返す", () => {
    const bills = [
      makeBillWithContent({ id: "routine", name: "専決処分の承認について" }),
      makeBillWithContent({
        id: "controversial",
        status: "rejected",
        status_note: "否決",
      }),
      makeBillWithContent({
        id: "featured-with-content",
        is_featured: true,
        bill_content: withContent(TEMPLATE_CONTENT),
      }),
    ];

    // 注目(30)+反対討論(25)+論点(15)=70 が、否決(50)より先に並ぶ
    expect(pickSessionHighlights(bills, 2).map((bill) => bill.id)).toEqual([
      "featured-with-content",
      "controversial",
    ]);
  });

  it("否決など異例の議決は、ほかに加点が無くても必ず含める", () => {
    const bills = [
      makeBillWithContent({
        id: "rejected",
        status: "rejected",
        status_note: "不認定（本会議の中継映像より）",
        submitted_date: "2019-12-02",
      }),
    ];

    expect(pickSessionHighlights(bills, 3).map((bill) => bill.id)).toEqual([
      "rejected",
    ]);
  });

  it("直近の会期でも、解説の定型の加点だけで異議なく可決された議案は含めない", () => {
    // 新しさの加点（+15）を足すと55点で閾値を超えてしまう議案。
    // 実例: 令和7年12月定例会では8件が候補になり、新しさの加点を除くと0件だった
    const bills = [
      makeBillWithContent({
        id: "recent-template-only",
        submitted_date: new Date().toISOString().slice(0, 10),
        bill_content: withContent(TEMPLATE_CONTENT),
      }),
    ];

    expect(pickSessionHighlights(bills, 3)).toEqual([]);
  });

  it("賛成多数で穏当に可決された議案は、テンプレート由来の加点だけでは閾値を超えず含まれない", () => {
    // 実例: 賛成14反対5で認定された決算議案（令和2年度田川市一般会計決算）。
    // 「反対討論」の記述＋「議会での主な論点」見出し＋生活密着キーワードの
    // ヒットだけでスコアが48点まで積み上がるが、否決ではないため
    // 「ハイライト」には含めない
    const bills = [
      makeBillWithContent({
        id: "settlement-passed-comfortably",
        submitted_date: "2021-10-08",
        bill_content: withContent(
          "学校再編について反対討論があった。\n## 議会での主な論点\n詳細"
        ),
      }),
    ];

    expect(pickSessionHighlights(bills, 3)).toEqual([]);
  });

  it("会期中でまだ本会議の議決が無い議案は、委員会の結論が不認定でも異例の議決として数えない", () => {
    const bills = [
      makeBillWithContent({
        id: "in-committee",
        status: "introduced",
        status_note: "委員会で不認定と決定",
      }),
    ];

    expect(pickSessionHighlights(bills, 3)).toEqual([]);
  });

  it("is_featuredのみで他に根拠がない議案は、countの余裕があっても閾値未満なら含めない", () => {
    const bills = [
      makeBillWithContent({ id: "featured-only", is_featured: true }),
    ];

    expect(pickSessionHighlights(bills, 5)).toEqual([]);
  });

  it("countが0件なら対象の議案があっても空配列を返す", () => {
    const bills = [
      makeBillWithContent({ status: "rejected", status_note: "否決" }),
    ];

    expect(pickSessionHighlights(bills, 0)).toEqual([]);
  });

  it("countが対象の議案数より多い場合は、対象の議案のみを返す", () => {
    const bills = [
      makeBillWithContent({
        id: "a",
        status: "rejected",
        status_note: "否決",
      }),
      makeBillWithContent({
        id: "b",
        status: "rejected",
        status_note: "否決",
      }),
      makeBillWithContent({ id: "c" }),
    ];

    expect(pickSessionHighlights(bills, 10)).toHaveLength(2);
  });
});

describe("findAdjacentSessions", () => {
  function makeSession(id: string, startDate: string): DietSessionNavItem {
    return { id, name: `会期${id}`, start_date: startDate };
  }

  it("start_date順で前後の会期を返す", () => {
    const sessions = [
      makeSession("a", "2025-01-01"),
      makeSession("b", "2025-04-01"),
      makeSession("c", "2025-09-01"),
    ];

    const result = findAdjacentSessions(sessions, "b");

    expect(result.previous?.id).toBe("a");
    expect(result.next?.id).toBe("c");
  });

  it("入力の並び順が乱れていてもstart_date順に並べ替えて判定する", () => {
    const sessions = [
      makeSession("c", "2025-09-01"),
      makeSession("a", "2025-01-01"),
      makeSession("b", "2025-04-01"),
    ];

    const result = findAdjacentSessions(sessions, "b");

    expect(result.previous?.id).toBe("a");
    expect(result.next?.id).toBe("c");
  });

  it("最初の会期はpreviousがnull", () => {
    const sessions = [
      makeSession("a", "2025-01-01"),
      makeSession("b", "2025-04-01"),
    ];

    const result = findAdjacentSessions(sessions, "a");

    expect(result.previous).toBeNull();
    expect(result.next?.id).toBe("b");
  });

  it("最後の会期はnextがnull", () => {
    const sessions = [
      makeSession("a", "2025-01-01"),
      makeSession("b", "2025-04-01"),
    ];

    const result = findAdjacentSessions(sessions, "b");

    expect(result.previous?.id).toBe("a");
    expect(result.next).toBeNull();
  });

  it("currentIdが存在しない場合はどちらもnull", () => {
    const sessions = [makeSession("a", "2025-01-01")];

    const result = findAdjacentSessions(sessions, "missing");

    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });
});
