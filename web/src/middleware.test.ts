import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isHtmlAcceptHeader,
  isValidDifficultyLevel,
  middleware,
} from "./middleware";

describe("isValidDifficultyLevel", () => {
  it("should return true for 'normal'", () => {
    expect(isValidDifficultyLevel("normal")).toBe(true);
  });

  it("should return true for 'hard'", () => {
    expect(isValidDifficultyLevel("hard")).toBe(true);
  });

  it("should return false for invalid value", () => {
    expect(isValidDifficultyLevel("easy")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidDifficultyLevel("")).toBe(false);
  });

  it("should return false for null", () => {
    expect(isValidDifficultyLevel(null)).toBe(false);
  });
});

describe("isHtmlAcceptHeader", () => {
  it("should return true for text/html", () => {
    expect(isHtmlAcceptHeader("text/html")).toBe(true);
  });

  it("should return true for accept header with text/html among others", () => {
    expect(
      isHtmlAcceptHeader(
        "text/html,application/xhtml+xml,application/xml;q=0.9"
      )
    ).toBe(true);
  });

  it("should return false for application/json", () => {
    expect(isHtmlAcceptHeader("application/json")).toBe(false);
  });

  it("should return false for image/png", () => {
    expect(isHtmlAcceptHeader("image/png")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isHtmlAcceptHeader("")).toBe(false);
  });
});

// robots-header.ts の判定が、ミドルウェアの応答ヘッダーとしてつながっていること
describe("middleware の X-Robots-Tag", () => {
  beforeEach(() => {
    // Basic 認証の設定が環境に残っていても、応答にヘッダーが付くかどうかだけを見る
    vi.stubEnv("BASIC_AUTH_USER", "");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function robotsTagFor(url: string): Promise<string | null> {
    const response = await middleware(new NextRequest(url));
    return response.headers.get("X-Robots-Tag");
  }

  it("検索結果（/search?q=予算）には noindex, follow を付ける", async () => {
    expect(await robotsTagFor("https://tagawa-gikai.jp/search?q=予算")).toBe(
      "noindex, follow"
    );
  });

  it("クエリなしの /search には付けない", async () => {
    expect(await robotsTagFor("https://tagawa-gikai.jp/search")).toBeNull();
  });

  it("/search 以外のページは、q を付けても付けない", async () => {
    expect(
      await robotsTagFor("https://tagawa-gikai.jp/committees?q=x")
    ).toBeNull();
  });
});
