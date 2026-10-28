import { describe, expect, it } from "vitest";
import {
  getMfaErrorMessage,
  isCompleteTotpCode,
  normalizeTotpCode,
} from "./mfa-error-message";

describe("getMfaErrorMessage", () => {
  it("コードに対応する日本語を返す", () => {
    expect(getMfaErrorMessage({ code: "mfa_verification_failed" })).toContain(
      "コードが違います"
    );
    expect(getMfaErrorMessage({ code: "mfa_factor_not_found" })).toContain(
      "やり直して"
    );
  });

  it("知らないコード・null は fallback（英語の生メッセージは出さない）", () => {
    expect(getMfaErrorMessage({ code: "x", message: "English" }, "代替")).toBe(
      "代替"
    );
    expect(getMfaErrorMessage(null, "代替")).toBe("代替");
  });
});

describe("normalizeTotpCode", () => {
  it("数字以外を除き6桁で切る", () => {
    expect(normalizeTotpCode("123 456")).toBe("123456");
    expect(normalizeTotpCode("12-34-56789")).toBe("123456");
    expect(normalizeTotpCode("１２３４５６")).toBe("123456");
    expect(normalizeTotpCode("abc")).toBe("");
  });
});

describe("isCompleteTotpCode", () => {
  it("ちょうど6桁の数字だけ true", () => {
    expect(isCompleteTotpCode("123456")).toBe(true);
    expect(isCompleteTotpCode("12345")).toBe(false);
    expect(isCompleteTotpCode("1234567")).toBe(false);
    expect(isCompleteTotpCode("12345a")).toBe(false);
  });
});
