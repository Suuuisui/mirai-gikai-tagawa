import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 公開中（is_published=true）のトピック分析がある議案のIDを取得する（sitemap 用）。
 * bill ごと公開は最大1版（one_published_per_bill）なので、議案IDは重複しない。
 * 公開中のトピック分析が1件も無ければ空配列
 */
export async function findPublishedAnalysisBillIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_analysis_version")
    .select("bill_id")
    .eq("is_published", true);
  if (error) {
    throw new Error(`Failed to fetch published analyses: ${error.message}`);
  }
  return (data ?? []).map((row) => row.bill_id);
}
