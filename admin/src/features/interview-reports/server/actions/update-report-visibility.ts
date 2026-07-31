"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import {
  findInterviewReportBySessionId,
  updateReportVisibility,
} from "../repositories/interview-report-repository";

interface UpdateReportVisibilityParams {
  reportId: string;
  isPublic: boolean;
  billId: string;
  sessionId: string;
}

interface UpdateReportVisibilityResult {
  success: boolean;
  error?: string;
}

export async function updateReportVisibilityAction(
  params: UpdateReportVisibilityParams
): Promise<UpdateReportVisibilityResult> {
  await requireAdmin();

  const { reportId, isPublic, billId, sessionId } = params;

  if (!reportId) {
    return {
      success: false,
      error: "レポートIDが必要です",
    };
  }

  try {
    if (isPublic) {
      const report = await findInterviewReportBySessionId(sessionId);
      if (!report?.is_public_by_user) {
        return {
          success: false,
          error:
            "ユーザーが非公開に設定しているため、管理者公開に変更できません",
        };
      }
    }

    await updateReportVisibility(reportId, isPublic);

    // Revalidate bill interview pages (reports are under interview config)
    revalidatePath(`/bills/${billId}`, "layout");
    // web側の回答一覧・トピックページ（ISR + billsタグ依存）にも即時反映する
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    console.error("Error updating report visibility:", error);
    return {
      success: false,
      error: "公開状態の更新に失敗しました",
    };
  }
}
