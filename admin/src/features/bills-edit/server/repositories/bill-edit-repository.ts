import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { BillInsert } from "../../shared/types";
import type { DifficultyLevel } from "../../shared/types/bill-contents";

export async function findBillById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data;
}

export async function findBillContentsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId)
    .order("difficulty_level");

  if (error) {
    throw new Error(`Failed to fetch bill contents: ${error.message}`);
  }

  return data ?? [];
}

export async function findBillTagIdsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill tag ids: ${error.message}`);
  }

  return data?.map((item) => item.tag_id) ?? [];
}

export async function findBillBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill by slug: ${error.message}`);
  }

  return data;
}

export async function createBillRecord(insertData: BillInsert) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create bill: ${error.message}`);
  }

  return data;
}

export async function updateBillRecord(
  id: string,
  updateData: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bills")
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update bill: ${error.message}`);
  }
}

export async function upsertBillContent(params: {
  billId: string;
  difficultyLevel: DifficultyLevel;
  title: string;
  summary: string;
  content: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("bill_contents").upsert(
    {
      bill_id: params.billId,
      difficulty_level: params.difficultyLevel,
      title: params.title,
      summary: params.summary,
      content: params.content,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "bill_id,difficulty_level",
    }
  );

  if (error) {
    throw new Error(
      `Failed to upsert bill content (${params.difficultyLevel}): ${error.message}`
    );
  }
}

export async function findBillsTagsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill tags: ${error.message}`);
  }

  return data?.map((t) => t.tag_id) ?? [];
}

export async function deleteBillsTags(billId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bills_tags")
    .delete()
    .eq("bill_id", billId)
    .in("tag_id", tagIds);

  if (error) {
    throw new Error(`Failed to delete bill tags: ${error.message}`);
  }
}

export async function createBillsTags(billId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  const billTags = tagIds.map((tagId) => ({
    bill_id: billId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("bills_tags").insert(billTags);

  if (error) {
    throw new Error(`Failed to create bill tags: ${error.message}`);
  }
}

/**
 * 「注目の議案」（is_featured=true）の id と featured_priority を取得する。
 * excludeBillId を指定すると、その議案を除いた一覧を返す（保存対象を除いた
 * 「他の注目議案」一覧を取得する用途）。
 */
export async function findFeaturedBillPriorities(excludeBillId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("bills")
    .select("id, featured_priority")
    .eq("is_featured", true);

  if (excludeBillId) {
    query = query.neq("id", excludeBillId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to fetch featured bill priorities: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * 複数議案の featured_priority を一括更新する。
 * is_featured を含む行はそれも同時に更新する（トップページ編集画面が
 * 注目の議案の追加・削除に使う。議案編集画面の自動整列は priority のみ）。
 */
export async function updateBillFeaturedPriorities(
  updates: Array<{
    id: string;
    featured_priority: number | null;
    is_featured?: boolean;
  }>
) {
  const supabase = createAdminClient();

  await Promise.all(
    updates.map(async ({ id, featured_priority, is_featured }) => {
      const { error } = await supabase
        .from("bills")
        .update({
          featured_priority,
          ...(is_featured !== undefined && { is_featured }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw new Error(
          `Failed to update featured priority for bill ${id}: ${error.message}`
        );
      }
    })
  );
}
