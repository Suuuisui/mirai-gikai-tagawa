import { ExternalLink, FileText } from "lucide-react";
import type { Bill } from "../../../shared/types";
import { parseExplanationMaterialUrls } from "../../../shared/utils/explanation-materials";

interface ExplanationMaterialsSectionProps {
  bill: Bill;
}

/**
 * 提出時の説明資料（PDF）セクション
 *
 * 田川市公式サイト「提出議案と議決結果」ページに掲載されている
 * 議案説明資料PDFへの外部リンクを表示する。
 * 資料が紐づいていない議案では何も表示しない
 */
export function ExplanationMaterialsSection({
  bill,
}: ExplanationMaterialsSectionProps) {
  const materials = parseExplanationMaterialUrls(
    bill.explanation_material_urls
  );
  if (materials.length === 0) {
    return null;
  }

  return (
    <section className="my-8 rounded-md bg-white px-4 py-6">
      <h3 className="text-sm font-bold text-black">提出時の説明資料（PDF）</h3>
      <ul className="mt-3 space-y-2">
        {materials.map((material) => (
          <li key={material.url}>
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-2 text-sm text-primary underline underline-offset-[3px] hover:opacity-70"
            >
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{material.label}</span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-mirai-text-note">
        議会への提出時に配布された議案説明資料です。リンク先は田川市公式サイトに掲載されたPDFファイルです。
      </p>
    </section>
  );
}
