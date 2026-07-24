import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * トップページのキュレーションに必要な公開済み議案を全件取得する。
 * 興味度スコアの計算に本文（content）が必要なため、normal難易度の
 * bill_contents を同時に取得する（トップページ本番の表示もnormal固定）。
 */
export async function findPublishedBillsForCuration() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      `
      id,
      name,
      status_note,
      submitted_date,
      is_featured,
      featured_priority,
      explanation_material_urls,
      diet_sessions ( name ),
      bill_contents ( title, summary, content, difficulty_level ),
      bills_tags ( tags ( id, label ) )
    `
    )
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", "normal")
    .order("submitted_date", { ascending: false })
    .limit(2000);

  if (error) {
    throw new Error(`公開議案の取得に失敗しました: ${error.message}`);
  }

  return data ?? [];
}

/**
 * 指定IDのうち「公開済み議案」として実在するIDを返す（保存時の検証用）。
 */
export async function findPublishedBillIds(ids: string[]) {
  if (ids.length === 0) return new Set<string>();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id")
    .in("id", ids)
    .eq("publish_status", "published");

  if (error) {
    throw new Error(`議案の検証に失敗しました: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.id));
}
