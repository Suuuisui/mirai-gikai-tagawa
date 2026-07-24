"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  findAllTagsWithBillCount,
  updateTagFeaturedPriorities,
} from "@/features/tags/server/repositories/tag-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { buildFeaturedTagUpdates } from "../../shared/utils/build-featured-updates";

const orderedTagIdsSchema = z
  .array(z.uuid())
  .max(30, "表示タグは30件までにしてください")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "同じタグが重複しています",
  });

/**
 * トップページのタグ別セクションに「どのタグをどの順で出すか」を保存する。
 * 配列の順番＝表示順。含まれないタグはトップページに出なくなる。
 */
export async function saveFeaturedTags(orderedTagIds: string[]) {
  try {
    await requireAdmin();

    const ids = orderedTagIdsSchema.parse(orderedTagIds);

    const allTags = await findAllTagsWithBillCount();
    const knownIds = new Set(allTags.map((tag) => tag.id));
    if (ids.some((id) => !knownIds.has(id))) {
      return {
        success: false as const,
        error:
          "存在しないタグが含まれています。ページを再読み込みしてやり直してください",
      };
    }

    const updates = buildFeaturedTagUpdates(
      allTags.map((tag) => ({
        id: tag.id,
        featured_priority: tag.featured_priority,
      })),
      ids
    );

    if (updates.length > 0) {
      await updateTagFeaturedPriorities(updates);
      await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    }

    return { success: true as const };
  } catch (error) {
    console.error("Save featured tags error:", error);
    return {
      success: false as const,
      error: getErrorMessage(
        error,
        "タグ表示設定の保存中にエラーが発生しました"
      ),
    };
  }
}
