import { describe, expect, it } from "vitest";
import { buildBillBreadcrumbItems } from "./bill-breadcrumb";

describe("buildBillBreadcrumbItems", () => {
  it("所属する会期があれば、会期のまとめを挟んだ 3 段にする", () => {
    expect(
      buildBillBreadcrumbItems({
        billTitle: "令和8年度田川市一般会計補正予算",
        session: { id: "session-1", name: "令和8年（第6回）9月定例会" },
      })
    ).toEqual([
      { label: "TOP", href: "/" },
      {
        label: "令和8年（第6回）9月定例会のまとめ",
        href: "/sessions/session-1",
      },
      { label: "令和8年度田川市一般会計補正予算" },
    ]);
  });

  it("会期が決まっていない議案は 2 段のまま", () => {
    expect(
      buildBillBreadcrumbItems({ billTitle: "議案第1号", session: null })
    ).toEqual([{ label: "TOP", href: "/" }, { label: "議案第1号" }]);
  });

  it("現在のページ（議案）には href を付けない", () => {
    const items = buildBillBreadcrumbItems({
      billTitle: "議案第1号",
      session: { id: "s", name: "会期" },
    });
    expect(items.at(-1)?.href).toBeUndefined();
  });
});
