import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** 同一ページに複数のパンくずを置く場合、2つ目以降はJSON-LDの重複出力を抑止する */
  withJsonLd?: boolean;
}

export function Breadcrumb({ items, withJsonLd = true }: BreadcrumbProps) {
  return (
    <>
      {/* 検索エンジン向けのパンくず構造化データを表示と同じitemsから出力し、
          ページ側での二重定義（表示用とJSON-LD用の別配列）を不要にする */}
      {withJsonLd && <BreadcrumbJsonLd items={items} />}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
        {/* 長い議案名などがスマホ幅で画面外へはみ出さないよう、
          折り返さずに truncate（…）で省略する */}
        {items.map((item, index) => (
          <span
            key={item.label}
            className="flex min-w-0 max-w-full items-center gap-2"
          >
            {index > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
            {item.href ? (
              <Link
                href={item.href as Route}
                className="truncate hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
