export type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";

/**
 * ユーザーが 1 回に送れるインタビューの回答の最大文字数。
 * サーバーの検証（validate-interview-chat-request）と、入力欄の maxLength で
 * 同じ値を使う（サーバーに弾かれる長さを、そもそも送らせないため）。
 */
export const INTERVIEW_MAX_USER_MESSAGE_CHARS = 8_000;
