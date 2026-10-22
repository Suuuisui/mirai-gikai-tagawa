/**
 * チャット機能で使用するエラーコード
 */
export const ChatErrorCode = {
  DAILY_COST_LIMIT_REACHED: "DAILY_COST_LIMIT_REACHED",
  SYSTEM_DAILY_COST_LIMIT_REACHED: "SYSTEM_DAILY_COST_LIMIT_REACHED",
  SYSTEM_MONTHLY_COST_LIMIT_REACHED: "SYSTEM_MONTHLY_COST_LIMIT_REACHED",
  /** 利用額の上限チェック自体が失敗した（DB エラーなど）。安全側に倒して処理を止める */
  COST_LIMIT_CHECK_FAILED: "COST_LIMIT_CHECK_FAILED",
  /** 公開中の議案・インタビュー設定が見つからない（非公開・存在しない） */
  INTERVIEW_NOT_AVAILABLE: "INTERVIEW_NOT_AVAILABLE",
  PROMPT_FETCH_FAILED: "PROMPT_FETCH_FAILED",
  LLM_GENERATION_FAILED: "LLM_GENERATION_FAILED",
} as const;

export type ChatErrorCode = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

/**
 * チャット機能のカスタムエラー
 */
export class ChatError extends Error {
  constructor(
    public readonly code: ChatErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = "ChatError";
  }
}
