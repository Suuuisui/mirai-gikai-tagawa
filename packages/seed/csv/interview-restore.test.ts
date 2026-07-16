import { describe, expect, it } from "vitest";
import {
  attachBillMatchKeys,
  billMatchKey,
  buildBillIdToMatchKey,
  buildMatchKeyToBillId,
  filterQuestionsForRestoredConfigs,
  resolveRestoredConfigs,
  type BillInfo,
  type InterviewConfigRow,
  type InterviewQuestionRow,
  type SessionInfo,
} from "./interview-restore";

const SESSIONS: SessionInfo[] = [
  { id: "sess-1", slug: "r8-4-teirei" },
  { id: "sess-2", slug: "r8-3-rinji" },
];

function makeConfig(overrides: Partial<InterviewConfigRow>): InterviewConfigRow {
  return {
    id: "config-1",
    bill_id: "bill-old-1",
    chat_model: null,
    created_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    estimated_duration: null,
    mode: "text",
    name: "みんなの声を聞かせてください",
    status: "published",
    themes: null,
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("billMatchKey", () => {
  it("会期slugと議案名を結合したキーを返す", () => {
    expect(billMatchKey("r8-4-teirei", "議案第7号　予算について")).toBe(
      "r8-4-teirei::議案第7号　予算について"
    );
  });
});

describe("buildBillIdToMatchKey / buildMatchKeyToBillId", () => {
  const bills: BillInfo[] = [
    { id: "bill-1", name: "議案第1号　予算", diet_session_id: "sess-1" },
    { id: "bill-2", name: "議案第2号　条例", diet_session_id: "sess-2" },
    { id: "bill-orphan", name: "会期不明議案", diet_session_id: null },
  ];

  it("bill_id -> matchKey の対応表を作る（会期が見つからないbillは除外）", () => {
    const map = buildBillIdToMatchKey(bills, SESSIONS);
    expect(map.get("bill-1")).toBe("r8-4-teirei::議案第1号　予算");
    expect(map.get("bill-2")).toBe("r8-3-rinji::議案第2号　条例");
    expect(map.has("bill-orphan")).toBe(false);
  });

  it("matchKey -> bill_id の対応表を作る", () => {
    const map = buildMatchKeyToBillId(bills, SESSIONS);
    expect(map.get("r8-4-teirei::議案第1号　予算")).toBe("bill-1");
    expect(map.get("r8-3-rinji::議案第2号　条例")).toBe("bill-2");
  });
});

describe("attachBillMatchKeys", () => {
  it("bill_idからmatchKeyを解決して付与する", () => {
    const config = makeConfig({ bill_id: "bill-1" });
    const billIdToMatchKey = new Map([["bill-1", "r8-4-teirei::議案第1号　予算"]]);
    const [result] = attachBillMatchKeys([config], billIdToMatchKey);
    expect(result.billMatchKey).toBe("r8-4-teirei::議案第1号　予算");
  });

  it("対応するbillが無い場合はnullを付与する", () => {
    const config = makeConfig({ bill_id: "bill-missing" });
    const [result] = attachBillMatchKeys([config], new Map());
    expect(result.billMatchKey).toBeNull();
  });
});

describe("resolveRestoredConfigs", () => {
  it("matchKeyが解決できたconfigは新bill_idに付け替えて復元する", () => {
    const snapshot = {
      ...makeConfig({ bill_id: "bill-old-1" }),
      billMatchKey: "r8-4-teirei::議案第1号　予算",
    };
    const matchKeyToNewBillId = new Map([
      ["r8-4-teirei::議案第1号　予算", "bill-new-1"],
    ]);
    const { restored, skipped } = resolveRestoredConfigs(
      [snapshot],
      matchKeyToNewBillId
    );
    expect(skipped).toHaveLength(0);
    expect(restored).toHaveLength(1);
    expect(restored[0].bill_id).toBe("bill-new-1");
    expect(restored[0].id).toBe(snapshot.id);
    expect(
      (restored[0] as unknown as Record<string, unknown>).billMatchKey
    ).toBeUndefined();
  });

  it("billMatchKeyがnullの場合はスキップする", () => {
    const snapshot = { ...makeConfig({}), billMatchKey: null };
    const { restored, skipped } = resolveRestoredConfigs([snapshot], new Map());
    expect(restored).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/データ不整合/);
  });

  it("新データ側に一致する議案が無い場合はスキップする", () => {
    const snapshot = {
      ...makeConfig({}),
      billMatchKey: "r8-4-teirei::存在しない議案",
    };
    const { restored, skipped } = resolveRestoredConfigs([snapshot], new Map());
    expect(restored).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toMatch(/一致する新データが見つかりません/);
  });
});

describe("filterQuestionsForRestoredConfigs", () => {
  const questions: InterviewQuestionRow[] = [
    {
      id: "q1",
      interview_config_id: "config-restored",
      created_at: "2026-01-01T00:00:00.000Z",
      follow_up_guide: null,
      question: "質問1",
      question_order: 1,
      quick_replies: null,
      target_audience: null,
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "q2",
      interview_config_id: "config-skipped",
      created_at: "2026-01-01T00:00:00.000Z",
      follow_up_guide: null,
      question: "質問2",
      question_order: 1,
      quick_replies: null,
      target_audience: null,
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];

  it("復元されたconfigに紐づくquestionsのみ残す", () => {
    const restoredIds = new Set(["config-restored"]);
    const result = filterQuestionsForRestoredConfigs(questions, restoredIds);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("q1");
  });
});
