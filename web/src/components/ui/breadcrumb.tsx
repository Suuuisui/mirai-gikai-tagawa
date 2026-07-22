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
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
          {item.href ? (
            <Link
              href={item.href as Route}
              className="whitespace-nowrap hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="whitespace-nowrap">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
