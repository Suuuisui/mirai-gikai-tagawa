import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";

/**
 * 議案詳細ページのパンくず項目。
 * 所属する会期があれば、その会期のまとめを間に挟んだ 3 段（TOP > 会期のまとめ > 議案）にする。
 * 会期が決まっていない議案は、間に挟む一覧が無いので 2 段のまま
 */
export function buildBillBreadcrumbItems({
  billTitle,
  session,
}: {
  billTitle: string;
  session: { id: string; name: string } | null;
}): BreadcrumbItem[] {
  return [
    { label: "TOP", href: routes.home() },
    ...(session
      ? [
          {
            label: `${session.name}のまとめ`,
            href: routes.sessionSummary(session.id),
          },
        ]
      : []),
    { label: billTitle },
  ];
}
