import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // 動的OG画像はSNS/画像検索から参照されるためAPI配下で唯一許可する
      allow: ["/", "/api/og/"],
      // token付きプレビューやチャットUI・API・開発用ページなど、
      // 検索結果に出す意味がないルート
      disallow: [
        "/preview/",
        "/bills/*/interview/chat",
        "/report/*/chat-log",
        "/api/",
        "/dev/",
      ],
    },
    sitemap: `${env.webUrl}/sitemap.xml`,
  };
}
