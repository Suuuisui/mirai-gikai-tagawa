import { routes } from "@/lib/routes";

export type ChatBillSummaryInput = {
  id: string;
  name: string;
  summary?: string;
  tags?: string[];
  isFeatured?: boolean;
};

/**
 * トップページチャットのシステムプロンプトに埋め込む議案サマリーのJSON文字列を組み立てる。
 *
 * 各議案に詳細ページの相対URL（`url`）を付与することで、AIが回答内で該当議案への
 * Markdownリンクを案内できるようにする（コンテキストに含まれないURLの創作を防ぐため、
 * URLは必ずここで id から機械的に生成する）。
 */
export function formatBillSummariesForPrompt(
  bills: ChatBillSummaryInput[]
): string {
  return JSON.stringify(
    bills.map(({ id, name, summary, tags, isFeatured }) => ({
      name,
      summary,
      tags,
      isFeatured,
      url: routes.billDetail(id),
    }))
  );
}
