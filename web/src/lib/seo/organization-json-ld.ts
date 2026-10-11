/**
 * サイトの運営者名。フッターの「運営: …」、WebSite 構造化データの publisher
 * （app/layout.tsx）、Organization 構造化データ、議案・委員会記録の Article の
 * author が共有する
 */
export const OPERATOR_NAME = "田川市政ラボ";

/**
 * 運営者（田川市政ラボ）の Organization 構造化データ。トップページに置く。
 * 運営者名とサイトの URL だけを載せる。連絡先・SNS・ロゴなど、サイトの
 * どこにも定めていない項目は入れない
 */
export function buildOrganizationJsonLd(
  baseUrl: string
): Record<string, unknown> {
  const siteUrl = new URL("/", baseUrl).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: OPERATOR_NAME,
    url: siteUrl,
  };
}
