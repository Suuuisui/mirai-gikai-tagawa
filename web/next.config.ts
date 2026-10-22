import type { NextConfig } from "next";
import { buildSupabaseImageRemotePatterns } from "../packages/shared/src/next/supabase-image-remote-pattern.cjs";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // `x-powered-by: Next.js` を返さない（使っているフレームワークを知らせる必要がないため）
  poweredByHeader: false,
  experimental: {
    serverSourceMaps: true,
  },
  // セキュリティヘッダー。CSPは外部リソース（Google Fonts, GA,
  // Supabase Storage, AI Gateway等）の洗い出しが必要なため別途対応とし、
  // ここでは既存機能を壊さず安全に追加できる基本ヘッダーのみ設定する
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
  // 旧URL（fork元の名残の /kokkai）からの恒久リダイレクト
  async redirects() {
    return [
      {
        source: "/kokkai",
        destination: "/archive",
        permanent: true,
      },
      {
        source: "/kokkai/:slug/bills",
        destination: "/archive/:slug/bills",
        permanent: true,
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
    ...(isDev && {
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment" as const,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
};

export default nextConfig;
