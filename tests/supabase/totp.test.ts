import { describe, expect, it } from "vitest";
import {
  decodeBase32,
  generateTotp,
  totpStep,
  waitUntilAfterTotpStep,
} from "./totp";

// RFC 6238 付録 B（SHA-1・8桁）。秘密は ASCII "12345678901234567890"
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("generateTotp（RFC 6238）", () => {
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])("時刻 %i 秒の8桁コードは %s", (seconds, expected) => {
    expect(
      generateTotp(RFC_SECRET, { timeMs: seconds * 1000, digits: 8 })
    ).toBe(expected);
  });

  it("6桁は8桁の下6桁と一致する", () => {
    expect(generateTotp(RFC_SECRET, { timeMs: 59_000 })).toBe("287082");
  });

  it("同じ30秒枠なら同じコード、枠が変われば変わる", () => {
    const a = generateTotp(RFC_SECRET, { timeMs: 30_000 });
    expect(generateTotp(RFC_SECRET, { timeMs: 59_999 })).toBe(a);
    expect(generateTotp(RFC_SECRET, { timeMs: 60_000 })).not.toBe(a);
  });
});

describe("decodeBase32", () => {
  it("小文字・空白・パディングを許す", () => {
    expect(decodeBase32("mzxw 6===").toString()).toBe("foo");
  });
  it("使えない文字はエラー", () => {
    expect(() => decodeBase32("1")).toThrow();
  });
});

describe("totpStep / waitUntilAfterTotpStep", () => {
  it("30秒ごとに番号が増える", () => {
    expect(totpStep(0)).toBe(0);
    expect(totpStep(29_999)).toBe(0);
    expect(totpStep(30_000)).toBe(1);
  });
  it("すでに過ぎた枠なら待たない", async () => {
    const past = totpStep() - 1;
    await expect(waitUntilAfterTotpStep(past)).resolves.toBe(totpStep());
  });
});
