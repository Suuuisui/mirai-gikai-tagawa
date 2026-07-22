import { describe, expect, it } from "vitest";
import { getLatestUpdatedAt } from "./latest-updated-at";

describe("getLatestUpdatedAt", () => {
  it("最も新しいupdated_atを返す", () => {
    const bills = [
      { updated_at: "2026-01-10T00:00:00Z" },
      { updated_at: "2026-06-01T00:00:00Z" },
      { updated_at: "2025-12-31T00:00:00Z" },
    ];
    const fallback = new Date("2020-01-01T00:00:00Z");

    expect(getLatestUpdatedAt(bills, fallback)).toEqual(
      new Date("2026-06-01T00:00:00Z")
    );
  });

  it("配列が1件の場合はその日付を返す", () => {
    const bills = [{ updated_at: "2026-03-15T00:00:00Z" }];
    const fallback = new Date("2020-01-01T00:00:00Z");

    expect(getLatestUpdatedAt(bills, fallback)).toEqual(
      new Date("2026-03-15T00:00:00Z")
    );
  });

  it("空配列の場合はfallbackを返す", () => {
    const fallback = new Date("2020-01-01T00:00:00Z");

    expect(getLatestUpdatedAt([], fallback)).toEqual(fallback);
  });

  it("並び順によらず最大値を返す", () => {
    const bills = [
      { updated_at: "2026-06-01T00:00:00Z" },
      { updated_at: "2026-01-10T00:00:00Z" },
    ];
    const fallback = new Date("2020-01-01T00:00:00Z");

    expect(getLatestUpdatedAt(bills, fallback)).toEqual(
      new Date("2026-06-01T00:00:00Z")
    );
  });
});
