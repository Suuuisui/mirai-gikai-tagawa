// 議案の共有画像（OG画像）の配色。
//
// ImageResponse（Satori）はTailwindクラスやCSSカスタムプロパティ（globals.cssの@theme変数）を
// 解決できないため、web/src/app/globals.css の `--color-cover-{family}-{1|2|3}` と
// `--color-mirai-text` / `--color-mirai-text-note` の実値を、ここに直接転記している。
// 配色を変えるときは globals.css とこのファイルの両方を直すこと。
// 片方だけ直すと cover-colors.test.ts が落ちる。
// （Next.js のルートファイル route.tsx は決まった名前以外を export できないため、別ファイルにしている）

export type CoverFamily =
  | "terracotta"
  | "slate"
  | "sage"
  | "ochre"
  | "brown"
  | "beige";

/** globals.css `--color-cover-{family}-{1|2|3}` の実値（濃淡 1〜3 の順） */
export const COVER_COLORS: Record<
  CoverFamily,
  readonly [string, string, string]
> = {
  terracotta: ["#f8e4d8", "#f3d3c1", "#ecc0a8"],
  slate: ["#e6ebee", "#d7dfe4", "#c6d1d8"],
  sage: ["#e7ede3", "#d6e0d0", "#c3d2bb"],
  ochre: ["#f3e9cf", "#ecdcb1", "#e3cd92"],
  brown: ["#ede1d5", "#e0cfbe", "#d1bba6"],
  beige: ["#f1ede6", "#e6dfd4", "#d9d0c2"],
};

/** globals.css `--color-mirai-text` の実値 */
export const MIRAI_TEXT = "#231f1c";
/** globals.css `--color-mirai-text-note` の実値（画面のカバーの日付 `text-mirai-text-note` と同じ） */
export const MIRAI_TEXT_NOTE = "#4f4843";
/** bg-cover-dots のドット色（`--color-mirai-text` の8%不透明度） */
export const DOT_COLOR = "rgba(35, 31, 28, 0.08)";
/** カテゴリアイコンの色（`--color-mirai-text` の15%不透明度） */
export const ICON_COLOR = "rgba(35, 31, 28, 0.15)";
