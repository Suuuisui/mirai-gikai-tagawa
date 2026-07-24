"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  findFeaturedBillPriorities,
  updateBillFeaturedPriorities,
} from "@/features/bills-edit/server/repositories/bill-edit-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { buildFeaturedBillUpdates } from "../../shared/utils/build-featured-updates";
import { findPublishedBillIds } from "../repositories/homepage-repository";

const orderedBillIdsSchema = z
  .array(z.uuid())
  .max(30, "注目の議案は30件までにしてください")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "同じ議案が重複しています",
  });

/**
 * トップページ「注目の議案」の選択と並び順を保存する。
 * 配列の順番＝表示順。含まれない議案は注目から外れる。
 */
export async function saveFeaturedBills(orderedBillIds: string[]) {
  try {
    await requireAdmin();

    const ids = orderedBillIdsSchema.parse(orderedBillIds);

    const [publishedIds, current] = await Promise.all([
      findPublishedBillIds(ids),
      findFeaturedBillPriorities(),
    ]);

    // 非公開・存在しない議案をfeatured化しない（公開サイトに出ないため）
    if (ids.some((id) => !publishedIds.has(id))) {
      return {
        success: false as const,
        error:
          "公開されていない議案が含まれています。ページを再読み込みしてやり直してください",
      };
    }

    const updates = buildFeaturedBillUpdates(current, ids);

    if (updates.length > 0) {
      await updateBillFeaturedPriorities(updates);
      await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    }

    return { success: true as const };
  } catch (error) {
    console.error("Save featured bills error:", error);
    return {
      success: false as const,
      error: getErrorMessage(error, "注目の議案の保存中にエラーが発生しました"),
    };
  }
}
