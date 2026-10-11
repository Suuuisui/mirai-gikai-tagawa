import { describe, expect, it } from "vitest";
import { buildSessionSummaryBreadcrumbItems } from "./session-breadcrumb";

describe("buildSessionSummaryBreadcrumbItems", () => {
  it("議会ごとのまとめ（一覧）を挟んだ 3 段にする", () => {
    expect(
      buildSessionSummaryBreadcrumbItems("令和8年（第6回）9月定例会")
    ).toEqual([
      { label: "TOP", href: "/" },
      { label: "議会ごとのまとめ", href: "/sessions" },
      { label: "令和8年（第6回）9月定例会のまとめ" },
    ]);
  });
});
