import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { env } from "@/lib/env";
import { JsonLd } from "./json-ld";

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * パンくずのBreadcrumbList構造化データ。
 * Googleのガイドライン（構造化データは可視コンテンツと一致させる）に
 * 従い、表示用Breadcrumbと同じitemsから生成する。通常は Breadcrumb が
 * 内部で出力するため、ページ側で直接使うことはない
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      // 末尾（現在ページ）はhrefを持たない。schema.org仕様上itemは省略可
      ...(item.href && {
        item: new URL(item.href, env.webUrl).toString(),
      }),
    })),
  };

  return <JsonLd data={data} />;
}
