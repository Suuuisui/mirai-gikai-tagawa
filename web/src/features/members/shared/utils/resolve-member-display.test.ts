import { describe, expect, it } from "vitest";
import {
  resolveMemberDisplayName,
  resolveMemberProfile,
} from "./resolve-member-display";

describe("resolveMemberProfile", () => {
  it("MEMBER_PROFILESに存在する姓はプロフィールを返す", () => {
    const profile = resolveMemberProfile("尾﨑");
    expect(profile?.fullName).toBe("尾﨑 行人");
  });

  it("MEMBER_PROFILESに存在しない姓はnullを返す", () => {
    expect(resolveMemberProfile("該当なし姓")).toBeNull();
  });
});

describe("resolveMemberDisplayName", () => {
  it("MEMBER_PROFILESにあればそのfullNameを優先する", () => {
    expect(resolveMemberDisplayName("尾﨑", ["尾﨑 太郎"])).toBe("尾﨑 行人");
  });

  it("MEMBER_PROFILESに無くsponsorsに一意なフルネームがあればそれを返す", () => {
    expect(resolveMemberDisplayName("該当なし姓", ["該当なし姓 花子"])).toBe(
      "該当なし姓 花子"
    );
  });

  it("MEMBER_PROFILESに無くsponsorsも一致しなければ姓のみ返す", () => {
    expect(resolveMemberDisplayName("該当なし姓", [])).toBe("該当なし姓");
  });

  it("MEMBER_PROFILESに無くsponsorsで表記ゆれが複数あれば姓のみ返す", () => {
    expect(
      resolveMemberDisplayName("該当なし姓", [
        "該当なし姓 花子",
        "該当なし姓 花代",
      ])
    ).toBe("該当なし姓");
  });
});
