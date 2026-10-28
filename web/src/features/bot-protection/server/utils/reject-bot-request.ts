import { checkBotId } from "botid/server";
import { jsonResponse, textResponse } from "@/lib/api/response";

/** ボットと判定されたときに利用者へ返す文言（画面にそのまま出る） */
export const BOT_BLOCKED_MESSAGE =
  "自動化されたアクセスと判断されたため、実行できませんでした。ページを再読み込みして、もう一度お試しください。";

/** ボットかどうかを判定できなかったときに利用者へ返す文言（画面にそのまま出る） */
export const BOT_CHECK_FAILED_MESSAGE =
  "ただいまアクセスの確認ができないため、AIをご利用いただけません。しばらく待ってから再度お試しください。";

/** `checkBotId` の戻り値のうち、ここで使う部分 */
export type BotCheckResult = { isBot?: boolean };

/** ボットかどうかを判定する関数（テストでは固定の結果を返す関数に差し替える） */
export type BotCheck = () => Promise<BotCheckResult>;

/**
 * 断るときのレスポンス本文の形。
 * - "text": 文言だけの本文。`useChat`・`useObject` は失敗したレスポンスの本文をそのままエラー文として画面に出す
 * - "json": `{ error: 文言 }`。`/api/interview/complete` を呼ぶクライアントは `error` を読んで画面に出す
 */
export type BotRejectionFormat = "text" | "json";

type RejectBotRequestOptions = {
  format?: BotRejectionFormat;
  check?: BotCheck;
};

function buildRejection(
  message: string,
  status: number,
  format: BotRejectionFormat
): Response {
  return format === "json"
    ? jsonResponse({ error: message }, status)
    : textResponse(message, status);
}

/**
 * Vercel BotID でボットを判定し、ボットなら AI を呼ぶ前に断るレスポンスを返す。
 * 守る API の `route.ts` の先頭（認証や本文の読み取りより前）で呼び、
 * 戻り値があればそのまま返す。`null` のときは続きの処理に進んでよい。
 *
 * - ボットと判定 → 403
 * - 判定そのものに失敗（BotID の API に届かない、OIDC トークンが無いなど）→ 503。
 *   ボットでないと確かめられないので通さない（fail-closed。利用額の上限チェックと同じ考え方）。
 *   原因はサーバーのログにだけ残し、利用者には固定の文言を返す
 *
 * 判定は、クライアントが付けるヘッダー（`BOT_PROTECTED_ROUTES` の API だけに付く）を見て行う。
 * ローカル開発とテストでは常に人として扱われる。
 */
export async function rejectBotRequest({
  format = "text",
  check = () => checkBotId(),
}: RejectBotRequestOptions = {}): Promise<Response | null> {
  let result: BotCheckResult;
  try {
    result = await check();
  } catch (error) {
    console.error("BotID check failed:", error);
    return buildRejection(BOT_CHECK_FAILED_MESSAGE, 503, format);
  }

  return result.isBot ? buildRejection(BOT_BLOCKED_MESSAGE, 403, format) : null;
}
