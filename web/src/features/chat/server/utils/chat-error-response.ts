import { textResponse } from "@/lib/api/response";
import { ChatError, ChatErrorCode } from "../../shared/types/errors";

/**
 * ChatError を適切な HTTP レスポンスに変換する。
 * ChatError でない場合は汎用の500レスポンスを返す。
 */
export function chatErrorToResponse(error: unknown): Response {
  if (error instanceof ChatError) {
    switch (error.code) {
      case ChatErrorCode.DAILY_COST_LIMIT_REACHED:
      case ChatErrorCode.SYSTEM_DAILY_COST_LIMIT_REACHED:
        return textResponse(
          "本日の利用上限に達しました。明日0時以降に再度お試しください。",
          429
        );
      case ChatErrorCode.SYSTEM_MONTHLY_COST_LIMIT_REACHED:
        return textResponse(
          "今月の利用上限に達しました。来月1日以降に再度お試しください。",
          429
        );
      case ChatErrorCode.COST_LIMIT_CHECK_FAILED:
        // 利用額を確認できないときは、上限を守れないので処理を止める（fail-closed）
        return textResponse(
          "ただいま利用状況を確認できないため、AIをご利用いただけません。しばらく待ってから再度お試しください。",
          503
        );
      case ChatErrorCode.INTERVIEW_NOT_AVAILABLE:
        return textResponse(
          "このインタビューは現在ご利用いただけません。",
          404
        );
      default:
        return textResponse(
          "エラーが発生しました。しばらく待ってから再度お試しください。",
          500
        );
    }
  }

  return textResponse(
    "エラーが発生しました。しばらく待ってから再度お試しください。",
    500
  );
}
