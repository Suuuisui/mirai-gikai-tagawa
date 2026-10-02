import type { Metadata } from "next";

/** サイト名（共有時の siteName や、ページの題名の後ろに付ける名前） */
export const SITE_NAME = "みらい議会＠田川市";

/** サイト共通の題名と説明（ページ固有の題名を持たないページの共有にも使う） */
export const SITE_TITLE = `${SITE_NAME}｜議案をやさしく解説`;
export const SITE_DESCRIPTION =
  "田川市議会に提出された議案・予算・条例・決議・意見書を、AIを活用してやさしい言葉で解説する市民向けプラットフォームです。";

/** サイト共通の共有画像（web/public/ogp.jpg） */
export const DEFAULT_OG_IMAGE = {
  url: "/ogp.jpg",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}のOGPイメージ`,
};

interface PageShareMetadataInput {
  title: string;
  description: string;
  /** ページのパス（routes の戻り値。metadataBase からの相対） */
  path: string;
}

/**
 * ページ固有の題名・説明で共有するときの openGraph と twitter。
 * Next.js のメタデータはトップレベルのキー（openGraph・twitter など）ごとに丸ごと上書きされる。
 * - openGraph: ページで書くとルートレイアウトの共有画像が消えるので、共通の画像を入れ直す
 * - twitter: ルートに題名・説明があり、上書きしないとサイト共通のままになる
 * ルートレイアウト（app/layout.tsx）にも同じ構成があるが、url はルートに置かない
 * （置くと、継承する全ページの og:url がトップページになる）
 */
export function buildPageShareMetadata({
  title,
  description,
  path,
}: PageShareMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
