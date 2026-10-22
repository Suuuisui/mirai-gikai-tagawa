import { describe, expect, it } from "vitest";
import { constantTimeEqual, isValidBearerToken } from "./constant-time-equal";

describe("constantTimeEqual", () => {
  it("同じ文字列なら true", () => {
    expect(constantTimeEqual("secret-token", "secret-token")).toBe(true);
  });

  it("同じ長さで中身が違えば false", () => {
    expect(constantTimeEqual("secret-token", "secret-tokeX")).toBe(false);
  });

  it("先頭だけ違っても、末尾だけ違っても false", () => {
    expect(constantTimeEqual("Xecret-token", "secret-token")).toBe(false);
    expect(constantTimeEqual("secret-tokeX", "secret-token")).toBe(false);
  });

  it("長さが違えば例外にならず false（短い・長い、どちらの向きも）", () => {
    expect(constantTimeEqual("secret", "secret-token")).toBe(false);
    expect(constantTimeEqual("secret-token-longer", "secret-token")).toBe(
      false
    );
  });

  it("片方が前方一致するだけの文字列は false", () => {
    expect(constantTimeEqual("secret-token-and-more", "secret-token")).toBe(
      false
    );
  });

  it("空文字どうしは true、空文字と非空文字は false", () => {
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("", "x")).toBe(false);
    expect(constantTimeEqual("x", "")).toBe(false);
  });

  it("日本語（マルチバイト）でも比較できる", () => {
    expect(constantTimeEqual("みらい議会", "みらい議会")).toBe(true);
    expect(constantTimeEqual("みらい議会", "みらい議員")).toBe(false);
  });
});

describe("isValidBearerToken", () => {
  const secret = "my-revalidate-secret";

  it("正しい Bearer ヘッダーなら true", () => {
    expect(isValidBearerToken(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("秘密が違えば false", () => {
    expect(isValidBearerToken("Bearer wrong-secret", secret)).toBe(false);
  });

  it("ヘッダーが無い（null・undefined・空文字）なら false", () => {
    expect(isValidBearerToken(null, secret)).toBe(false);
    expect(isValidBearerToken(undefined, secret)).toBe(false);
    expect(isValidBearerToken("", secret)).toBe(false);
  });

  it("Bearer 以外のスキームや、スキームだけのヘッダーは false", () => {
    expect(isValidBearerToken(`Basic ${secret}`, secret)).toBe(false);
    expect(isValidBearerToken(secret, secret)).toBe(false);
    expect(isValidBearerToken("Bearer", secret)).toBe(false);
    expect(isValidBearerToken("Bearer ", secret)).toBe(false);
  });

  it("スキームの綴り（大文字小文字）は厳密に一致が必要", () => {
    expect(isValidBearerToken(`bearer ${secret}`, secret)).toBe(false);
  });

  it("期待する秘密が未設定（undefined・null・空文字）なら、どんなヘッダーでも false", () => {
    expect(isValidBearerToken("Bearer ", "")).toBe(false);
    expect(isValidBearerToken("Bearer undefined", undefined)).toBe(false);
    expect(isValidBearerToken("Bearer null", null)).toBe(false);
    expect(isValidBearerToken(undefined, undefined)).toBe(false);
  });

  it("秘密の前後に余計な文字や空白があれば false", () => {
    expect(isValidBearerToken(`Bearer ${secret} `, secret)).toBe(false);
    expect(isValidBearerToken(`Bearer  ${secret}`, secret)).toBe(false);
    expect(isValidBearerToken(`Bearer ${secret}x`, secret)).toBe(false);
  });
});
