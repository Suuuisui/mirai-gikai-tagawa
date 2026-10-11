import { describe, expect, it } from "vitest";
import { getRobotsTagForRequest, NOINDEX_FOLLOW } from "./robots-header";

function tagFor(url: string): string | null {
  const { pathname, searchParams } = new URL(url, "https://tagawa-gikai.jp");
  return getRobotsTagForRequest(pathname, searchParams);
}

describe("getRobotsTagForRequest", () => {
  it("検索結果（/search?q=…）は noindex にする", () => {
    expect(tagFor("/search?q=予算")).toBe(NOINDEX_FOLLOW);
    expect(tagFor("/search?q=%E4%BA%88%E7%AE%97&difficulty=hard")).toBe(
      NOINDEX_FOLLOW
    );
  });

  it("クエリなしの /search は検索ページとしてインデックスさせる", () => {
    expect(tagFor("/search")).toBeNull();
  });

  it("q が空・空白だけのときは検索結果ではないので付けない", () => {
    expect(tagFor("/search?q=")).toBeNull();
    expect(tagFor("/search?q=%20%20")).toBeNull();
  });

  it("q が全角空白だけのときも、検索結果ではないので付けない", () => {
    expect(tagFor("/search?q=%E3%80%80")).toBeNull();
  });

  it("q 以外のクエリだけなら付けない", () => {
    expect(tagFor("/search?difficulty=hard")).toBeNull();
  });

  it("末尾にスラッシュがあっても、/search と同じ扱いにする", () => {
    expect(tagFor("/search/?q=予算")).toBe(NOINDEX_FOLLOW);
    expect(tagFor("/search/")).toBeNull();
  });

  it("q が複数あるときは、どれか 1 つでも検索語があれば noindex にする", () => {
    expect(tagFor("/search?q=&q=x")).toBe(NOINDEX_FOLLOW);
    expect(tagFor("/search?q=x&q=")).toBe(NOINDEX_FOLLOW);
    expect(tagFor("/search?q=&q=%20")).toBeNull();
  });

  it("ほかのページは、q を付けても対象にしない", () => {
    expect(tagFor("/committees?q=予算")).toBeNull();
    expect(tagFor("/?q=予算")).toBeNull();
  });

  it("パスが /search で始まるだけのページは対象にしない", () => {
    expect(tagFor("/searching?q=x")).toBeNull();
    expect(tagFor("/search/x?q=y")).toBeNull();
  });
});
