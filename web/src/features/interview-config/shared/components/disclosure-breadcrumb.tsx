import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import {
  getBillDetailLink,
  getInterviewLPLink,
} from "../utils/interview-links";

interface DisclosureBreadcrumbProps {
  billId: string;
  previewToken?: string;
  /** ページ下部の2つ目のパンくずではJSON-LDの重複出力を抑止する */
  withJsonLd?: boolean;
}

export function DisclosureBreadcrumb({
  billId,
  previewToken,
  withJsonLd,
}: DisclosureBreadcrumbProps) {
  const items = [
    { label: "TOP", href: routes.home() },
    { label: "議案詳細", href: getBillDetailLink(billId, previewToken) },
    {
      label: "AIインタビュー",
      href: getInterviewLPLink(billId, previewToken),
    },
    { label: "情報開示" },
  ];

  return <Breadcrumb items={items} withJsonLd={withJsonLd} />;
}
