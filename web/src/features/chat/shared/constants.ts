/**
 * suggest_interviewツールの名前（サーバー側ツール定義用）
 */
export const SUGGEST_INTERVIEW_TOOL_NAME = "suggest_interview";

/**
 * suggest_interviewツールのUIメッセージpart type（クライアント側判定用）
 */
export const SUGGEST_INTERVIEW_TOOL_TYPE =
  `tool-${SUGGEST_INTERVIEW_TOOL_NAME}` as const;

/**
 * ユーザーが 1 回に送れるチャットメッセージの最大文字数。
 * サーバーの検証（validate-chat-request）と、入力欄の maxLength・選択テキストの切り詰めで
 * 同じ値を使う（サーバーに弾かれる長さを、そもそも送らせないため）。
 */
export const CHAT_MAX_USER_MESSAGE_CHARS = 8_000;
