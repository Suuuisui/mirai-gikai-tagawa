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

const { getPreviousDietSession } = await import("./get-previous-diet-session");

describe("getPreviousDietSession 統合テスト", () => {
  const sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  it("基準日時点で既に終了している会期のうち、開始日が最も新しいものを返す", async () => {
    const older = await createTestDietSession({
      start_date: "2027-01-01",
      end_date: "2027-06-30",
      is_active: false,
    });
    sessionIds.push(older.id);

    // is_active はfalseのままだが、こちらの方が新しく閉会している
    const mostRecentlyConcluded = await createTestDietSession({
      start_date: "2028-01-01",
      end_date: "2028-06-30",
      is_active: false,
    });
    sessionIds.push(mostRecentlyConcluded.id);

    const result = await getPreviousDietSession(new Date(2028, 6, 15));

    expect(result?.id).toBe(mostRecentlyConcluded.id);
  });

  it("is_active=trueの会期が最新でも、基準日時点で終了していれば返す（is_activeの更新有無に依存しない）", async () => {
    // 運営がis_activeの付け替えを忘れていても正しく動くことを確認する
    const activeButConcluded = await createTestDietSession({
      start_date: "2029-01-01",
      end_date: "2029-01-10",
      is_active: true,
    });
    sessionIds.push(activeButConcluded.id);

    const result = await getPreviousDietSession(new Date(2029, 0, 20));

    expect(result?.id).toBe(activeButConcluded.id);
  });

  it("基準日時点でまだ終了していない会期は返さない", async () => {
    const ongoing = await createTestDietSession({
      start_date: "2030-01-01",
      end_date: "2030-06-30",
      is_active: false,
    });
    sessionIds.push(ongoing.id);

    const result = await getPreviousDietSession(new Date(2030, 2, 1));

    expect(result?.id).not.toBe(ongoing.id);
  });

  it("該当する会期がない場合は null を返す", async () => {
    const result = await getPreviousDietSession(new Date(1900, 0, 1));

    expect(result).toBeNull();
  });
});
