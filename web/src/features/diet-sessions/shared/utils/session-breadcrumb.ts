import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";

/** 会期まとめページのパンくず項目（TOP > 議会ごとのまとめ > 会期のまとめ の 3 段） */
export function buildSessionSummaryBreadcrumbItems(
  sessionName: string
): BreadcrumbItem[] {
  return [
    { label: "TOP", href: routes.home() },
    { label: "議会ごとのまとめ", href: routes.sessionArchive() },
    { label: `${sessionName}のまとめ` },
  ];
}
