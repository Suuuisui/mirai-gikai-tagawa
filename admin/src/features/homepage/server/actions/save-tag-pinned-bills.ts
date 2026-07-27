"use server";

import { BILLS_PER_TAG } from "@mirai-gikai/shared/top-page/config";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  findBillIdsByTag,
  updateTagPinnedBills,
} from "../repositories/homepage-repository";

const inputSchema = z.object({
  tagId: z.uuid(),
  orderedBillIds: z
    .array(z.uuid())
    .max(
      BILLS_PER_TAG,
      `固定表示は${BILLS_PER_TAG}件までにしてください（枠の数と同じ）`
    )
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "同じ議案が重複しています",
    }),
});

/**
 * トップページのタグ枠に固定表示（ピン留め）する議案を保存する。
 * 配列の順番＝表示順。空配列を渡すとピン留めをすべて解除し、
 * 全枠が自動選定（興味度スコア順）に戻る。
 */
export async function saveTagPinnedBills(
  tagId: string,
  orderedBillIds: string[]
) {
  try {
    await requireAdmin();

    const input = inputSchema.parse({ tagId, orderedBillIds });

    const tagBillIds = await findBillIdsByTag(input.tagId);
    if (input.orderedBillIds.some((id) => !tagBillIds.has(id))) {
      return {
        success: false as const,
        error:
          "このタグに紐づいていない議案が含まれています。ページを再読み込みしてやり直してください",
      };
    }

    await updateTagPinnedBills(input.tagId, input.orderedBillIds);
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true as const };
  } catch (error) {
    console.error("Save tag pinned bills error:", error);
    return {
      success: false as const,
      error: getErrorMessage(error, "固定表示の保存中にエラーが発生しました"),
    };
  }
}
