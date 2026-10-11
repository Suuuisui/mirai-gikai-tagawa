import { describe, expect, it } from "vitest";
import { buildBreadcrumbListJsonLd } from "./breadcrumb-json-ld";

const BASE_URL = "https://tagawa-gikai.jp";

describe("buildBreadcrumbListJsonLd", () => {
  it("パンくずを位置つきの ListItem にして、リンク先を絶対 URL にする", () => {
    const data = buildBreadcrumbListJsonLd(
      [
        { label: "TOP", href: "/" },
        { label: "委員会の記録", href: "/committees" },
        { label: "本会議（2026.10.8）" },
      ],
      BASE_URL
    );

    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "TOP",
          item: "https://tagawa-gikai.jp/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "委員会の記録",
          item: "https://tagawa-gikai.jp/committees",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "本会議（2026.10.8）",
        },
      ],
    });
  });

  it("現在のページ（href なし）には item を付けない", () => {
    const data = buildBreadcrumbListJsonLd([{ label: "TOP" }], BASE_URL);
    const [only] = data.itemListElement as Array<Record<string, unknown>>;
    expect("item" in only).toBe(false);
  });

  it("日本語のパスは、エンコードした絶対 URL にする", () => {
    const data = buildBreadcrumbListJsonLd(
      [{ label: "榊原", href: "/members/榊原" }],
      BASE_URL
    );
    const [entry] = data.itemListElement as Array<Record<string, unknown>>;
    expect(entry.item).toBe(
      "https://tagawa-gikai.jp/members/%E6%A6%8A%E5%8E%9F"
    );
  });

  it("エンコード済みのパスは、二重にエンコードせず、そのまま絶対 URL にする", () => {
    const data = buildBreadcrumbListJsonLd(
      [{ label: "榊原", href: "/members/%E6%A6%8A%E5%8E%9F" }],
      BASE_URL
    );
    const [entry] = data.itemListElement as Array<Record<string, unknown>>;
    expect(entry.item).toBe(
      "https://tagawa-gikai.jp/members/%E6%A6%8A%E5%8E%9F"
    );
  });

  it("本番以外の baseUrl でも、その baseUrl を付けた絶対 URL になる", () => {
    const data = buildBreadcrumbListJsonLd(
      [{ label: "TOP", href: "/" }],
      "http://localhost:3000"
    );
    const [entry] = data.itemListElement as Array<Record<string, unknown>>;
    expect(entry.item).toBe("http://localhost:3000/");
  });

  it("項目が無ければ空のリストにする", () => {
    const data = buildBreadcrumbListJsonLd([], BASE_URL);
    expect(data.itemListElement).toEqual([]);
  });
});
