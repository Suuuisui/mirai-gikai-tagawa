import { describe, expect, it } from "vitest";
import {
  buildSupabaseImageRemotePatterns,
  getHostedSupabaseHostname,
} from "./supabase-image-remote-pattern.cjs";

describe("getHostedSupabaseHostname", () => {
  it("ホスティング版の URL からホスト名を取り出す", () => {
    expect(
      getHostedSupabaseHostname("https://sbptehjmjxwstnvmwmsi.supabase.co")
    ).toBe("sbptehjmjxwstnvmwmsi.supabase.co");
  });

  it("末尾のスラッシュやパスがあってもホスト名だけを取り出す", () => {
    expect(
      getHostedSupabaseHostname("https://abcdefghij0123456789.supabase.co/")
    ).toBe("abcdefghij0123456789.supabase.co");
    expect(
      getHostedSupabaseHostname(
        "https://abcdefghij0123456789.supabase.co/rest/v1"
      )
    ).toBe("abcdefghij0123456789.supabase.co");
  });

  it("大文字のホスト名は小文字にそろえる", () => {
    expect(getHostedSupabaseHostname("https://ABCDEF.SUPABASE.CO")).toBe(
      "abcdef.supabase.co"
    );
  });

  it.each([
    ["未設定（undefined）", undefined],
    ["未設定（null）", null],
    ["空文字", ""],
    ["URL として読めない文字列", "not a url"],
    ["ローカル（127.0.0.1）", "http://127.0.0.1:54421"],
    ["ローカル（localhost）", "http://localhost:54321"],
    ["ホスティング版でない独自ドメイン", "https://db.example.com"],
    ["supabase.co そのもの（プロジェクトのサブドメインでない）", "https://supabase.co"],
    [
      "supabase.co を名前に含むだけの別ドメイン",
      "https://abcdef.supabase.co.evil.example",
    ],
    ["supabase.co を後ろにつなげただけの別ドメイン", "https://evilsupabase.co"],
    [
      "ユーザー情報で supabase.co に見せかけた別ドメイン",
      "https://abcdef.supabase.co@evil.example",
    ],
  ])("%s は null", (_name, url) => {
    expect(getHostedSupabaseHostname(url)).toBeNull();
  });
});

describe("buildSupabaseImageRemotePatterns", () => {
  it("ホスティング版なら、そのホスト名だけを許可する設定を 1 件返す", () => {
    expect(
      buildSupabaseImageRemotePatterns("https://sbptehjmjxwstnvmwmsi.supabase.co")
    ).toEqual([
      {
        protocol: "https",
        hostname: "sbptehjmjxwstnvmwmsi.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
    ]);
  });

  it("ワイルドカード（*.supabase.co）は使わない", () => {
    const patterns = buildSupabaseImageRemotePatterns(
      "https://sbptehjmjxwstnvmwmsi.supabase.co"
    );

    expect(patterns).toHaveLength(1);
    expect(patterns[0].hostname).not.toContain("*");
  });

  it.each([
    ["未設定", undefined],
    ["ローカル", "http://127.0.0.1:54421"],
    ["独自ドメイン", "https://db.example.com"],
    ["URL として読めない文字列", "not a url"],
  ])("%s なら空配列（ローカル用の固定の設定だけが使われる）", (_name, url) => {
    expect(buildSupabaseImageRemotePatterns(url)).toEqual([]);
  });
});
