import { env } from "@/lib/env";
import { JsonLd } from "./json-ld";

interface ItemListJsonLdProps {
  /** 一覧の表示順どおりのアイテム（urlは相対パス可） */
  items: Array<{ url: string; name: string }>;
}

/**
 * 一覧ページ用の ItemList 構造化データ。
 * 検索エンジンに一覧とその並びを伝え、配下ページの発見を助ける
 */
export function ItemListJsonLd({ items }: ItemListJsonLdProps) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: new URL(item.url, env.webUrl).toString(),
      name: item.name,
    })),
  };

  return <JsonLd data={data} />;
}
