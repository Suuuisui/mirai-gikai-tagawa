import { z } from "zod";
import {
  failValidation,
  getStatusFromZodError,
  type RequestValidationResult,
} from "@/lib/api/request-validation";
import { INTERVIEW_MAX_USER_MESSAGE_CHARS } from "../constants";
import { type InterviewStage, interviewStageSchema } from "../schemas";

/**
 * /api/interview/chat のリクエストに対する上限。
 *
 * インタビューのクライアントも会話の履歴を毎回すべて送る。インタビューは通常のチャットより
 * 長く続く（質問に沿って 20〜40 往復、最後にレポートを作る）ため、会話全体の上限は
 * チャットより大きい。通常の使い方には届かず、細工したリクエストで 1 回の費用を
 * 膨らませることだけを防ぐ値にしてある。
 */
export const INTERVIEW_CHAT_REQUEST_LIMITS = {
  /** 会話全体のメッセージ数（質問と回答の合計。100 往復ぶん） */
  maxMessages: 200,
  /** ユーザーが 1 回に送れる回答の文字数 */
  maxUserMessageChars: INTERVIEW_MAX_USER_MESSAGE_CHARS,
  /**
   * 会話全体の文字数の合計（質問と回答の合計）。
   * AI の過去の発言は 1 件ずつには上限を置かず、この合計にだけ含める
   * （レポートを含む長い発言が 1 件あっただけで会話が続けられなくなるのを避けるため）
   */
  maxTotalChars: 100_000,
  maxIdChars: 100,
  maxPreviewTokenChars: 256,
} as const;

export const INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES = {
  invalid: "リクエストの形式が正しくありません。",
  tooLong:
    "会話が長くなりすぎました。ページを開き直してから、もう一度お試しください。",
  messageTooLong: `1 回に送れる回答は ${INTERVIEW_CHAT_REQUEST_LIMITS.maxUserMessageChars.toLocaleString("ja-JP")} 文字までです。短くしてもう一度お試しください。`,
} as const;

const L = INTERVIEW_CHAT_REQUEST_LIMITS;

const requestSchema = z.looseObject({
  messages: z
    .array(
      z.object({
        // クライアントから system メッセージは受け付けない（システムプロンプトの差し込みを防ぐ）
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1)
    .max(L.maxMessages),
  // 議案 ID は DB の uuid
  billId: z.guid(),
  currentStage: interviewStageSchema,
  isRetry: z.boolean().nullish(),
  nextQuestionId: z.string().max(L.maxIdChars).nullish(),
  previewToken: z.string().max(L.maxPreviewTokenChars).nullish(),
});

export type ValidatedInterviewChatRequest = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  billId: string;
  currentStage: InterviewStage;
  isRetry?: boolean;
  nextQuestionId?: string;
  previewToken?: string;
};

/**
 * /api/interview/chat のリクエスト本文を検証する。
 * 形式の誤りは 400、件数・長さの超過は 413 と、日本語のメッセージを返す。
 */
export function validateInterviewChatRequestBody(
  body: unknown
): RequestValidationResult<ValidatedInterviewChatRequest> {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const status = getStatusFromZodError(parsed.error);
    return failValidation(
      status,
      status === 413
        ? INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.tooLong
        : INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.invalid
    );
  }

  const { messages } = parsed.data;

  const longestUserMessageChars = Math.max(
    0,
    ...messages
      .filter((message) => message.role === "user")
      .map((message) => message.content.length)
  );
  if (longestUserMessageChars > L.maxUserMessageChars) {
    return failValidation(
      413,
      INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.messageTooLong
    );
  }

  const totalChars = messages.reduce(
    (sum, message) => sum + message.content.length,
    0
  );
  if (totalChars > L.maxTotalChars) {
    return failValidation(413, INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.tooLong);
  }

  return {
    success: true,
    data: {
      messages,
      billId: parsed.data.billId,
      currentStage: parsed.data.currentStage,
      isRetry: parsed.data.isRetry ?? undefined,
      nextQuestionId: parsed.data.nextQuestionId ?? undefined,
      previewToken: parsed.data.previewToken ?? undefined,
    },
  };
}
