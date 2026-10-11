interface BreadcrumbEntry {
  label: string;
  href?: string;
}

/**
 * パンくずの BreadcrumbList（構造化データ）を作る。
 * 表示用のパンくずと同じ項目から作り（構造化データは画面に見えている内容と
 * 一致させる、という Google の決まり）、リンク先は baseUrl を付けた絶対 URL にする。
 * 現在のページ（href なし）は item を省く。schema.org では末尾の item は省略できる
 */
export function buildBreadcrumbListJsonLd(
  items: readonly BreadcrumbEntry[],
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && {
        item: new URL(item.href, baseUrl).toString(),
      }),
    })),
  };
}
