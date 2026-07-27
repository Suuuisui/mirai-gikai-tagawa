import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
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
  );
}
