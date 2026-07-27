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
      bills_tags ( pinned_priority, tags ( id, label ) )
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
 * タグ枠のピン留め設定を保存する。
 * 対象タグの既存ピンをすべて解除してから、指定された議案に1始まりの
 * 優先順位を振り直す（orderedBillIdsの並び＝表示順）。
 */
export async function updateTagPinnedBills(
  tagId: string,
  orderedBillIds: string[]
) {
  const supabase = createAdminClient();

  const { error: clearError } = await supabase
    .from("bills_tags")
    .update({ pinned_priority: null })
    .eq("tag_id", tagId)
    .not("pinned_priority", "is", null);

  if (clearError) {
    throw new Error(`ピン留めの解除に失敗しました: ${clearError.message}`);
  }

  await Promise.all(
    orderedBillIds.map(async (billId, index) => {
      const { error } = await supabase
        .from("bills_tags")
        .update({ pinned_priority: index + 1 })
        .eq("tag_id", tagId)
        .eq("bill_id", billId);

      if (error) {
        throw new Error(
          `ピン留めの保存に失敗しました (${billId}): ${error.message}`
        );
      }
    })
  );
}

/**
 * 指定タグに紐づく議案IDを返す（ピン留め保存時の検証用）。
 */
export async function findBillIdsByTag(tagId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("bill_id")
    .eq("tag_id", tagId);

  if (error) {
    throw new Error(`タグの議案取得に失敗しました: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.bill_id));
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
