import type { NextConfig } from "next";
import { buildSupabaseImageRemotePatterns } from "../packages/shared/src/next/supabase-image-remote-pattern.cjs";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // `x-powered-by: Next.js` を返さない（使っているフレームワークを知らせる必要がないため）
  poweredByHeader: false,
  experimental: {
    serverSourceMaps: true,
  },
  // セキュリティヘッダー（web と同じ考え方）。管理画面は他のサイトに埋め込まれる
  // 理由がないため、フレーム内での表示は一切許可しない（クリックジャッキング対策）。
  // CSP は frame-ancestors だけを指定する。ほかのディレクティブを足すと外部リソース
  // （フォント・解析・Supabase など）が壊れる恐れがあり、洗い出しが済むまで入れない
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  typedRoutes: true,
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      // 自分の Supabase プロジェクトの画像だけを許可する（ビルド時に
      // NEXT_PUBLIC_SUPABASE_URL から読む）。`*.supabase.co` を丸ごと許可すると、
      // 他人のプロジェクトの画像まで /_next/image 経由で最適化させられる。
      // 環境変数がない・ローカルのときは何も足さず、上の 127.0.0.1 の設定だけが使われる
      ...buildSupabaseImageRemotePatterns(process.env.NEXT_PUBLIC_SUPABASE_URL),
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
