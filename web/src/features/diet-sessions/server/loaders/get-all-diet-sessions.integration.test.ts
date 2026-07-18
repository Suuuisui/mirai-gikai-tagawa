import {
  cleanupTestDietSession,
  createTestDietSession,
} from "@test-utils/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache はモジュール初期化時に評価されるため、
// setup の共通モック（vitest.integration.setup.ts）だけでは不十分。
// テストファイル内で vi.mock → 動的インポートの順序を保証する必要がある。
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

const { getAllDietSessions } = await import("./get-all-diet-sessions");

describe("getAllDietSessions 統合テスト", () => {
  const sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  it("全ての会期を開始日の新しい順に返す", async () => {
    const older = await createTestDietSession({
      start_date: "2027-01-01",
      end_date: "2027-06-30",
      is_active: false,
    });
    const newer = await createTestDietSession({
      start_date: "2029-01-01",
      end_date: "2029-06-30",
      is_active: false,
    });
    sessionIds.push(older.id, newer.id);

    const result = await getAllDietSessions();
    const resultIds = result.map((s) => s.id);
    const olderIndex = resultIds.indexOf(older.id);
    const newerIndex = resultIds.indexOf(newer.id);

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeLessThan(olderIndex);
  });
});
