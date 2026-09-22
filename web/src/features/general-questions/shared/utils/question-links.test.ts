import { describe, expect, it } from "vitest";
import { alignOutlineWithItems, resolveMemberPageKey } from "./question-links";

const context = {
  memberNames: new Set(["髙瀬", "山野", "佐藤"]),
  profileFullNameByFamily: new Map([
    ["髙瀬", "髙瀬 冨士夫"],
    ["山野", "山野 義人"],
  ]),
};

describe("resolveMemberPageKey", () => {
  it("議員ページがあり名簿のフルネームと一致すれば姓を返す", () => {
    expect(
      resolveMemberPageKey({ familyName: "山野", name: "山野 義人" }, context)
    ).toBe("山野");
  });

  it("同じ姓でも名簿と違う人物にはリンクしない", () => {
    expect(
      resolveMemberPageKey({ familyName: "髙瀬", name: "髙瀬 春美" }, context)
    ).toBeNull();
    expect(
      resolveMemberPageKey({ familyName: "髙瀬", name: "髙瀬 冨士夫" }, context)
    ).toBe("髙瀬");
  });

  it("名簿に無い姓は議員ページの有無だけで決める", () => {
    expect(
      resolveMemberPageKey({ familyName: "佐藤", name: "佐藤 俊一" }, context)
    ).toBe("佐藤");
    expect(
      resolveMemberPageKey({ familyName: "植木", name: "植木 康太" }, context)
    ).toBeNull();
  });
});

describe("alignOutlineWithItems", () => {
  const outline = [{ title: "A", points: [] }];

  it("項目数が一致するときだけ要旨を返す", () => {
    expect(alignOutlineWithItems({ items: ["A"], outline })).toEqual(outline);
    expect(alignOutlineWithItems({ items: ["A", "B"], outline })).toBeNull();
    expect(alignOutlineWithItems({ items: ["A"], outline: null })).toBeNull();
  });
});
