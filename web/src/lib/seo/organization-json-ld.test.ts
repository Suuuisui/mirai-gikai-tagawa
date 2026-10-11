import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, OPERATOR_NAME } from "./organization-json-ld";

describe("buildOrganizationJsonLd", () => {
  it("運営者名とサイトの URL だけを載せる", () => {
    expect(buildOrganizationJsonLd("https://tagawa-gikai.jp")).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://tagawa-gikai.jp/#organization",
      name: "田川市政ラボ",
      url: "https://tagawa-gikai.jp/",
    });
  });

  it("連絡先・SNS・ロゴは載せない", () => {
    const data = buildOrganizationJsonLd("https://tagawa-gikai.jp");
    for (const key of [
      "email",
      "telephone",
      "sameAs",
      "logo",
      "contactPoint",
    ]) {
      expect(key in data).toBe(false);
    }
  });

  it("運営者名は「田川市政ラボ」（フッターや構造化データの表記を、この定数にそろえている）", () => {
    expect(OPERATOR_NAME).toBe("田川市政ラボ");
  });
});
