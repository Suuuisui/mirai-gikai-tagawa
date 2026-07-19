import {
  cleanupTestDietSession,
  createTestDietSession,
} from "@test-utils/utils";
import { afterEach, describe, expect, it } from "vitest";
import {
  findActiveDietSession,
  findAllDietSessions,
  findAllDietSessionsForNav,
  findCurrentDietSession,
  findDietSessionById,
  findDietSessionBySlug,
  findPreviousDietSession,
} from "./diet-session-repository";

describe("diet-session-repository 統合テスト", () => {
  const sessionIds: string[] = [];

  afterEach(async () => {
    for (const id of sessionIds) {
      await cleanupTestDietSession(id);
    }
    sessionIds.length = 0;
  });

  describe("findActiveDietSession", () => {
    it("is_active=true の会期を返す", async () => {
      const session = await createTestDietSession({ is_active: true });
      sessionIds.push(session.id);

      const result = await findActiveDietSession();

      expect(result).not.toBeNull();
      expect(result?.is_active).toBe(true);
    });
  });

  describe("findCurrentDietSession", () => {
    it("指定日が範囲内の会期を返す", async () => {
      const session = await createTestDietSession({
        start_date: "2028-04-01",
        end_date: "2028-09-30",
        is_active: false,
      });
      sessionIds.push(session.id);

      const result = await findCurrentDietSession("2028-06-15");

      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
    });

    it("開始日ちょうどの日付で会期を返す", async () => {
      const session = await createTestDietSession({
        start_date: "2028-04-01",
        end_date: "2028-09-30",
        is_active: false,
      });
      sessionIds.push(session.id);

      const result = await findCurrentDietSession("2028-04-01");

      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
    });

    it("終了日ちょうどの日付で会期を返す", async () => {
      const session = await createTestDietSession({
        start_date: "2028-04-01",
        end_date: "2028-09-30",
        is_active: false,
      });
      sessionIds.push(session.id);

      const result = await findCurrentDietSession("2028-09-30");

      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
    });

    it("範囲外の日付では該当会期を返さない", async () => {
      const session = await createTestDietSession({
        start_date: "2032-04-01",
        end_date: "2032-09-30",
        is_active: false,
      });
      sessionIds.push(session.id);

      const result = await findCurrentDietSession("2032-10-01");

      if (result) {
        expect(result.id).not.toBe(session.id);
      } else {
        expect(result).toBeNull();
      }
    });
  });

  describe("findDietSessionBySlug", () => {
    it("slug で会期を取得できる", async () => {
      const slug = `test-repo-slug-${Date.now()}`;
      const session = await createTestDietSession({ slug });
      sessionIds.push(session.id);

      const result = await findDietSessionBySlug(slug);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
      expect(result?.slug).toBe(slug);
    });

    it("存在しない slug では null を返す", async () => {
      const result = await findDietSessionBySlug("non-existent-slug-999999999");

      expect(result).toBeNull();
    });
  });

  describe("findAllDietSessions", () => {
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

      const result = await findAllDietSessions();
      const resultIds = result.map((s) => s.id);
      const olderIndex = resultIds.indexOf(older.id);
      const newerIndex = resultIds.indexOf(newer.id);

      expect(olderIndex).toBeGreaterThanOrEqual(0);
      expect(newerIndex).toBeGreaterThanOrEqual(0);
      // 開始日が新しい会期ほど先に出現する
      expect(newerIndex).toBeLessThan(olderIndex);
    });
  });

  describe("findDietSessionById", () => {
    it("idで会期を取得できる", async () => {
      const session = await createTestDietSession({});
      sessionIds.push(session.id);

      const result = await findDietSessionById(session.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(session.id);
      expect(result?.name).toBe(session.name);
    });

    it("存在しないidではnullを返す", async () => {
      const result = await findDietSessionById(
        "00000000-0000-0000-0000-000000000000"
      );

      expect(result).toBeNull();
    });
  });

  describe("findAllDietSessionsForNav", () => {
    it("id, name, start_dateのみを開始日の古い順で返す", async () => {
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

      const result = await findAllDietSessionsForNav();
      const olderIndex = result.findIndex((s) => s.id === older.id);
      const newerIndex = result.findIndex((s) => s.id === newer.id);

      expect(olderIndex).toBeGreaterThanOrEqual(0);
      expect(newerIndex).toBeGreaterThanOrEqual(0);
      // 開始日が古い会期ほど先に出現する
      expect(olderIndex).toBeLessThan(newerIndex);
      expect(Object.keys(result[olderIndex]).sort()).toEqual([
        "id",
        "name",
        "start_date",
      ]);
    });
  });

  describe("findPreviousDietSession", () => {
    it("指定日より前の直近の会期を返す", async () => {
      const session = await createTestDietSession({
        start_date: "2027-01-01",
        end_date: "2027-06-30",
        is_active: false,
      });
      sessionIds.push(session.id);

      const result = await findPreviousDietSession("2028-01-01");

      expect(result).not.toBeNull();
      // biome-ignore lint/style/noNonNullAssertion: toBeNull 後に安全
      expect(new Date(result!.start_date) < new Date("2028-01-01")).toBe(true);
    });

    it("指定日より前の会期がない場合は null を返す", async () => {
      const result = await findPreviousDietSession("1900-01-01");

      expect(result).toBeNull();
    });
  });
});
