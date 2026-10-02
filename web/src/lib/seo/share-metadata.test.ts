import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildPageShareMetadata,
  DEFAULT_OG_IMAGE,
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
      title: "田川市の選挙の投票率",
      description: "年代別・投票区別の投票率です。",
      url: "/elections",
      siteName: SITE_NAME,
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
});

describe("DEFAULT_OG_IMAGE", () => {
  it("public に画像ファイルがある", () => {
    const file = fileURLToPath(
      new URL(`../../../public${DEFAULT_OG_IMAGE.url}`, import.meta.url)
    );
    expect(existsSync(file)).toBe(true);
  });
});
