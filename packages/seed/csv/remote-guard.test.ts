import { describe, expect, it } from "vitest";
import { checkSeedTarget, isLocalSupabaseUrl } from "./remote-guard";

describe("isLocalSupabaseUrl", () => {
  it.each([
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "http://[::1]:54321",
    "http://supabase.localhost:54321",
  ])("%s はローカル", (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(true);
  });

  it.each([
    "https://abcdefgh.supabase.co",
    "http://localhost.evil.example",
    "not a url",
    "",
    undefined,
  ])("%s はローカルではない", (url) => {
    expect(isLocalSupabaseUrl(url)).toBe(false);
  });
});

describe("checkSeedTarget", () => {
  it("ローカルなら許可する", () => {
    expect(checkSeedTarget("http://127.0.0.1:54321", {})).toBeNull();
  });

  it("リモートはフラグが無ければ理由を返す", () => {
    expect(checkSeedTarget("https://abc.supabase.co", {})).toContain(
      "localhost ではありません"
    );
  });

  it("リモートでも SEED_CSV_ALLOW_REMOTE=1 なら許可する", () => {
    expect(
      checkSeedTarget("https://abc.supabase.co", { SEED_CSV_ALLOW_REMOTE: "1" })
    ).toBeNull();
  });

  it("URL が未設定なら止める", () => {
    expect(checkSeedTarget(undefined, {})).not.toBeNull();
  });
});
