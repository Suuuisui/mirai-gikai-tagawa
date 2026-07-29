import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // token付きプレビューやチャットUIなど、検索結果に出す意味がないルート
      disallow: ["/preview/", "/bills/*/interview/chat", "/report/*/chat-log"],
    },
    sitemap: `${env.webUrl}/sitemap.xml`,
  };
}
