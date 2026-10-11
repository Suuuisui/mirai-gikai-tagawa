import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildPageShareMetadata,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
} from "./share-metadata";

describe("buildPageShareMetadata", () => {
  const metadata = buildPageShareMetadata({
    title: "田川市の選挙の投票率",
    description: "年代別・投票区別の投票率です。",
    path: "/elections",
  });

  it("openGraph にページの題名・説明・URL と、サイト共通の画像を入れる", () => {
    expect(metadata.openGraph).toEqual({
      type: "website",
      title: "田川市の選挙の投票率",
      description: "年代別・投票区別の投票率です。",
      url: "/elections",
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      images: [DEFAULT_OG_IMAGE],
    });
  });

  it("twitter も同じ題名・説明と共通の画像で、大きい画像のカードにする", () => {
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "田川市の選挙の投票率",
      description: "年代別・投票区別の投票率です。",
      images: [DEFAULT_OG_IMAGE.url],
    });
  });

  it("共有画像を指定すると、openGraph と twitter の両方がその画像になる", () => {
    const withImage = buildPageShareMetadata({
      title: "議案のトピック一覧",
      description: "議案に寄せられた意見のまとめです。",
      path: "/bills/abc/topics",
      image: {
        url: "https://example.com/share.png",
        alt: "議案の共有画像",
      },
    });
    expect(withImage.openGraph?.images).toEqual([
      { url: "https://example.com/share.png", alt: "議案の共有画像" },
    ]);
    expect(withImage.twitter?.images).toEqual([
      "https://example.com/share.png",
    ]);
  });

  it("type を article にすると、公開日・更新日を og に入れる", () => {
    const article = buildPageShareMetadata({
      title: "本会議の記録",
      description: "会議の要約です。",
      path: "/committees/abc",
      type: "article",
      publishedTime: "2026-10-08",
      modifiedTime: "2026-10-11T04:54:28.362Z",
    });
    expect(article.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-10-08",
      modifiedTime: "2026-10-11T04:54:28.362Z",
      siteName: SITE_NAME,
      url: "/committees/abc",
    });
  });
});

describe("DEFAULT_OG_IMAGE", () => {
  it("public に画像ファイルがある", () => {
    const file = fileURLToPath(
      new URL(`../../../public${DEFAULT_OG_IMAGE.url}`, import.meta.url)
    );
    expect(existsSync(file)).toBe(true);
  });
});
