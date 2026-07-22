import { describe, expect, it } from "vitest";
import { resolveBillOgImageUrl } from "./bill-og-image";

const WEB_URL = "https://example.com";

describe("resolveBillOgImageUrl", () => {
  it("thumbnail_url・share_thumbnail_url が共に未設定なら動的OG画像APIを返す", () => {
    expect(
      resolveBillOgImageUrl(
        { id: "bill-1", share_thumbnail_url: null, thumbnail_url: null },
        WEB_URL
      )
    ).toBe("https://example.com/api/og/bills/bill-1");
  });

  it("thumbnail_url がデフォルトサムネイル（/img/bill-thumbnails/配下）なら動的OG画像APIを返す", () => {
    expect(
      resolveBillOgImageUrl(
        {
          id: "bill-1",
          share_thumbnail_url: null,
          thumbnail_url: "/img/bill-thumbnails/budget.png",
        },
        WEB_URL
      )
    ).toBe("https://example.com/api/og/bills/bill-1");
  });

  it("share_thumbnail_url が個別設定されていれば維持する", () => {
    expect(
      resolveBillOgImageUrl(
        {
          id: "bill-1",
          share_thumbnail_url: "https://img/share.jpg",
          thumbnail_url: null,
        },
        WEB_URL
      )
    ).toBe("https://img/share.jpg");
  });

  it("thumbnail_url が個別画像（デフォルト以外）なら維持する", () => {
    expect(
      resolveBillOgImageUrl(
        {
          id: "bill-1",
          share_thumbnail_url: null,
          thumbnail_url: "https://img/custom-thumb.jpg",
        },
        WEB_URL
      )
    ).toBe("https://img/custom-thumb.jpg");
  });

  it("share_thumbnail_url と thumbnail_url の両方が個別設定されていれば share_thumbnail_url を優先する", () => {
    expect(
      resolveBillOgImageUrl(
        {
          id: "bill-1",
          share_thumbnail_url: "https://img/share.jpg",
          thumbnail_url: "https://img/custom-thumb.jpg",
        },
        WEB_URL
      )
    ).toBe("https://img/share.jpg");
  });

  it("bill が null なら webUrl 基準のデフォルトOGPを返す", () => {
    expect(resolveBillOgImageUrl(null, WEB_URL)).toBe(
      "https://example.com/ogp.jpg"
    );
  });
});
