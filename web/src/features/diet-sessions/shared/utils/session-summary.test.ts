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
  const now = new Date("2026-07-19T00:00:00+09:00");

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

  it("閾値を超える議案の中からスコアの高い順に上位N件を返す", () => {
    const bills = [
      makeBillWithContent({ id: "routine", name: "専決処分の承認について" }),
      makeBillWithContent({
        id: "controversial",
        status: "rejected",
        status_note: "否決",
      }),
      makeBillWithContent({
        id: "debated",
        bill_content: {
          title: "",
          summary: "",
          content: "反対討論があった。\n## 議会での主な論点\n詳細",
          // biome-ignore lint/suspicious/noExplicitAny: テスト用ダミーのため型を緩める
        } as any,
      }),
    ];

    const result = pickSessionHighlights(bills, 2, now);

    expect(result.map((bill) => bill.id)).toEqual(["controversial", "debated"]);
  });

  it("賛成多数で穏当に可決された議案は、テンプレート由来の加点だけでは閾値を超えず含まれない", () => {
    // 実例: 賛成14反対5で認定された決算議案（令和2年度田川市一般会計決算）。
    // 「反対討論」の記述＋「議会での主な論点」見出し＋生活密着キーワードの
    // ヒットだけでスコアが48点まで積み上がるが、否決でも直近でもないため
    // 「ハイライト」には含めない
    const bills = [
      makeBillWithContent({
        id: "settlement-passed-comfortably",
        submitted_date: "2021-10-08",
        bill_content: {
          title: "",
          summary: "",
          content:
            "学校再編について反対討論があった。\n## 議会での主な論点\n詳細",
          // biome-ignore lint/suspicious/noExplicitAny: テスト用ダミーのため型を緩める
        } as any,
      }),
    ];

    expect(pickSessionHighlights(bills, 3, now)).toEqual([]);
  });

  it("is_featuredのみで他に根拠がない議案は、countの余裕があっても閾値未満なら含めない", () => {
    const bills = [
      makeBillWithContent({ id: "featured-only", is_featured: true }),
    ];

    expect(pickSessionHighlights(bills, 5, now)).toEqual([]);
  });

  it("countが0件なら閾値を超える議案があっても空配列を返す", () => {
    const bills = [
      makeBillWithContent({ status: "rejected", status_note: "否決" }),
    ];

    expect(pickSessionHighlights(bills, 0, now)).toEqual([]);
  });

  it("countが閾値を超える議案数より多い場合は、閾値を超える議案のみを返す", () => {
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
    ];

    expect(pickSessionHighlights(bills, 10, now)).toHaveLength(2);
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
