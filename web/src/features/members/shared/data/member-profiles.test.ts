import { COUNCIL_FAMILY_NAMES } from "@mirai-gikai/shared/council/family-names";
import { describe, expect, it } from "vitest";
import { MEMBER_PROFILES } from "./member-profiles";

describe("MEMBER_PROFILES", () => {
  it("名簿の姓はすべて共有の姓リスト（seed のスクレイパーが氏名を分ける表）に載っている", () => {
    const missing = Object.keys(MEMBER_PROFILES).filter(
      (family) => !COUNCIL_FAMILY_NAMES.includes(family)
    );
    expect(missing).toEqual([]);
  });

  it("フルネームは「姓 名」で、姓がキーと一致する", () => {
    for (const [family, profile] of Object.entries(MEMBER_PROFILES)) {
      expect(profile.fullName.startsWith(`${family} `)).toBe(true);
    }
  });
});
