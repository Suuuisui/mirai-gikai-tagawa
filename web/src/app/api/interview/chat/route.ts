import { rejectBotRequest } from "@/features/bot-protection/server/utils/reject-bot-request";
import {
  checkSystemDailyCostLimit,
  checkSystemMonthlyCostLimit,
} from "@/features/chat/server/services/system-cost-guard";
import { chatErrorToResponse } from "@/features/chat/server/utils/chat-error-response";
import { runCostLimitCheck } from "@/features/chat/server/utils/run-cost-limit-check";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { handleInterviewChatRequest } from "@/features/interview-session/server/services/handle-interview-chat-request";
import {
  INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES,
  validateInterviewChatRequestBody,
} from "@/features/interview-session/shared/utils/validate-interview-chat-request";
import { jsonResponse } from "@/lib/api/response";
import { registerNodeTelemetry } from "@/lib/telemetry/register";

export async function POST(req: Request) {
  // ボットは、認証や本文の読み取りより先に、AI を呼ぶ前に断る（Vercel BotID）
  const botRejection = await rejectBotRequest();
  if (botRejection) {
    return botRejection;
  }

  // Vercel node環境でinstrumentationが自動で起動しない問題対応
  // 明示的にtelemetryを初期化
  await registerNodeTelemetry();

  // 未認証のリクエストは、本文を読む前に断る
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return jsonResponse({ error: "Anonymous session required" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.invalid },
      400
    );
  }

  // メッセージの件数・長さに上限を設ける（細工したリクエストで 1 回の費用を膨らませたり、
  // 想定外のステージ・ロールを差し込んだりさせない）
  const validation = validateInterviewChatRequestBody(body);
  if (!validation.success) {
    return jsonResponse({ error: validation.message }, validation.status);
  }
  const { messages, billId, currentStage, isRetry, previewToken } =
    validation.data;

  try {
    // システム全体の予算上限チェック（日次・月次）。
    // チェック自体が失敗したときも、上限を守れないので止める（fail-closed）
    await runCostLimitCheck(async () => {
      await checkSystemDailyCostLimit();
      await checkSystemMonthlyCostLimit();
    });

    return await handleInterviewChatRequest({
      messages,
      billId,
      currentStage,
      isRetry,
      previewToken,
      userId: user.id,
    });
  } catch (error) {
    console.error("Interview chat request error:", error);
    return chatErrorToResponse(error);
  }
}
