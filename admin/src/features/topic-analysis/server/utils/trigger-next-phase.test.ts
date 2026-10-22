import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// @/lib/env は import 時に Supabase の環境変数を要求するため、先にダミー値を入れる
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54421");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "dummy-publishable-key");

const { verifyInternalAuth } = await import("./trigger-next-phase");

function buildRequest(authorization?: string): Request {
  return new Request("http://localhost/api/topic-analysis/phases/phase1", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe("verifyInternalAuth", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", "internal-secret");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("正しい Bearer トークンなら例外を投げない", () => {
    expect(() =>
      verifyInternalAuth(buildRequest("Bearer internal-secret"))
    ).not.toThrow();
  });

  it("トークンが違えば Unauthorized を投げる", () => {
    expect(() => verifyInternalAuth(buildRequest("Bearer wrong"))).toThrow(
      "Unauthorized"
    );
  });

  it("長さの違うトークンでも TypeError ではなく Unauthorized を投げる", () => {
    expect(() =>
      verifyInternalAuth(buildRequest("Bearer internal-secret-and-more"))
    ).toThrow("Unauthorized");
  });

  it("Authorization ヘッダーが無ければ Unauthorized を投げる", () => {
    expect(() => verifyInternalAuth(buildRequest())).toThrow("Unauthorized");
  });

  it("Bearer 以外のスキームなら Unauthorized を投げる", () => {
    expect(() =>
      verifyInternalAuth(buildRequest("Basic internal-secret"))
    ).toThrow("Unauthorized");
  });

  it("REVALIDATE_SECRET が未設定なら、設定漏れとして例外を投げる", () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    expect(() =>
      verifyInternalAuth(buildRequest("Bearer internal-secret"))
    ).toThrow("REVALIDATE_SECRET is not configured");
  });
});
