import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { env } from "@/lib/env";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/breadcrumb-json-ld";
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
  return <JsonLd data={buildBreadcrumbListJsonLd(items, env.webUrl)} />;
}
