import type { Metadata } from "next";
import type { ReactNode } from "react";

// token付きの未公開議案プレビューのため、検索エンジンにインデックスさせない。
// robots.ts の disallow はクロールを止めるだけで、外部リンク経由で発見された
// URLが検索結果に表示されること自体は防げないため、noindexも併用する
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
