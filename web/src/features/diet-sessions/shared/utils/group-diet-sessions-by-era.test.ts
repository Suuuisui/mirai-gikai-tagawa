import { describe, expect, it } from "vitest";
import type { DietSession } from "../types";
import { groupDietSessionsByEraYear } from "./group-diet-sessions-by-era";

function makeSession(overrides: Partial<DietSession>): DietSession {
  return {
    id: overrides.id ?? "test-id",
    name: overrides.name ?? "令和8年（第4回）6月定例会",
    slug: overrides.slug ?? "test-slug",
    shugiin_url: overrides.shugiin_url ?? null,
    start_date: overrides.start_date ?? "2026-06-12",
    end_date: overrides.end_date ?? "2026-07-01",
    is_active: overrides.is_active ?? false,
    created_at: overrides.created_at ?? "2026-06-12T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-06-12T00:00:00.000Z",
  };
}

describe("groupDietSessionsByEraYear", () => {
  it("会期名の先頭の令和N年でグルーピングする", () => {
    const sessions = [
      makeSession({ id: "1", name: "令和8年（第4回）6月定例会" }),
      makeSession({ id: "2", name: "令和8年（第3回）5月臨時会" }),
      makeSession({ id: "3", name: "令和7年（第7回）12月定例会" }),
    ];

    const groups = groupDietSessionsByEraYear(sessions);

    expect(groups).toEqual([
      {
        label: "令和8年",
        sessions: [sessions[0], sessions[1]],
      },
      {
        label: "令和7年",
        sessions: [sessions[2]],
      },
    ]);
  });

  it("グループ内の並び順（入力順）を維持する", () => {
    const sessions = [
      makeSession({ id: "1", name: "令和7年（第7回）12月定例会" }),
      makeSession({ id: "2", name: "令和7年（第6回）9月定例会" }),
      makeSession({ id: "3", name: "令和7年（第5回）7月臨時会" }),
    ];

    const groups = groupDietSessionsByEraYear(sessions);

    expect(groups).toHaveLength(1);
    expect(groups[0].sessions.map((s) => s.id)).toEqual(["1", "2", "3"]);
  });

  it("同じラベルの会期が離れて出現しても同一グループにまとめる", () => {
    const sessions = [
      makeSession({ id: "1", name: "令和6年（第5回）12月定例会" }),
      makeSession({ id: "2", name: "令和7年（第1回）3月定例会" }),
      makeSession({ id: "3", name: "令和6年（第4回）11月臨時会" }),
    ];

    const groups = groupDietSessionsByEraYear(sessions);

    expect(groups.map((g) => g.label)).toEqual(["令和6年", "令和7年"]);
    expect(groups[0].sessions.map((s) => s.id)).toEqual(["1", "3"]);
    expect(groups[1].sessions.map((s) => s.id)).toEqual(["2"]);
  });

  it("令和元年（数字ではなく「元」表記）も正しくラベル化する", () => {
    const sessions = [
      makeSession({ id: "1", name: "令和元年（第5回）12月定例会" }),
    ];

    const groups = groupDietSessionsByEraYear(sessions);

    expect(groups).toEqual([{ label: "令和元年", sessions: [sessions[0]] }]);
  });

  it("令和N年のパターンにマッチしない会期名は、会期名全体をラベルにする", () => {
    const sessions = [makeSession({ id: "1", name: "臨時会（特別開催）" })];

    const groups = groupDietSessionsByEraYear(sessions);

    expect(groups).toEqual([
      { label: "臨時会（特別開催）", sessions: [sessions[0]] },
    ]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(groupDietSessionsByEraYear([])).toEqual([]);
  });
});
