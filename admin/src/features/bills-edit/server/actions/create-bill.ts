"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type BillCreateInput, billCreateSchema } from "../../shared/types";
import { createBillRecord } from "../repositories/bill-edit-repository";
import { resequenceFeaturedPrioritiesAfterSave } from "../services/resequence-featured-priorities-service";

export async function createBill(input: BillCreateInput) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // バリデーション
    const validatedData = billCreateSchema.parse(input);

    const insertData = {
      ...validatedData,
      submitted_date: validatedData.submitted_date
        ? `${validatedData.submitted_date}T00:00:00+09:00`
        : null,
    };

    // Supabaseに挿入
    const inserted = await createBillRecord(insertData);

    // 新規に「注目の議案」として作成された場合のみ、表示順を自動整列する
    // （非featuredで新規作成される場合は既存の並びに影響しないためスキップ）
    if (validatedData.is_featured) {
      await resequenceFeaturedPrioritiesAfterSave({
        id: inserted.id,
        is_featured: validatedData.is_featured,
        featured_priority: validatedData.featured_priority ?? null,
      });
    }

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
  } catch (error) {
    console.error("Create bill error:", error);
    throw new Error(
      getErrorMessage(error, "議案の作成中にエラーが発生しました")
    );
  }

  // 成功したら一覧ページへリダイレクト
  redirect(routes.bills());
}
