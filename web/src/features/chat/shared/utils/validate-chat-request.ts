import type { UIMessage } from "ai";
import { z } from "zod";
import { VALID_DIFFICULTY_LEVELS } from "@/features/bill-difficulty/shared/types";
import {
  failValidation,
  getStatusFromZodError,
  type RequestValidationResult,
} from "@/lib/api/request-validation";
import { CHAT_MAX_USER_MESSAGE_CHARS } from "../constants";

/**
 * /api/chat のリクエストに対する上限。
 *
 * useChat は会話の履歴を毎回すべて送る。そのため上限は「1 回の送信」ではなく
 * 「会話全体」で決めている。通常の使い方（議案についての質問を十数往復）では
 * 届かず、細工したリクエストで 1 回の費用を膨らませることだけを防ぐ値にしてある。
 */
export const CHAT_REQUEST_LIMITS = {
  /** 会話全体のメッセージ数（ユーザーと AI の合計。25 往復ぶん） */
  maxMessages: 50,
  /** ユーザーが 1 回に送れるメッセージの文字数 */
  maxUserMessageChars: CHAT_MAX_USER_MESSAGE_CHARS,
  /**
   * 会話全体のテキストの合計文字数（ユーザーと AI の合計）。
   * AI の過去の回答は 1 件ずつには上限を置かず、この合計にだけ含める
   * （長い回答が 1 件あっただけで会話が続けられなくなるのを避けるため）
   */
  maxTotalTextChars: 30_000,
  /** テキスト以外のパーツ（ツールの入出力など）を JSON にしたときの合計文字数 */
  maxTotalOtherPartsChars: 60_000,
  /** 1 メッセージに含められるパーツの数 */
  maxPartsPerMessage: 100,
  /** トップページのチャットが送る議案サマリーの件数（システムプロンプトに入る） */
  maxHomeBills: 300,
  maxIdChars: 200,
  maxBillNameChars: 1_000,
  maxBillSummaryChars: 5_000,
  maxBillTags: 50,
  maxTagChars: 100,
} as const;

export const CHAT_REQUEST_ERROR_MESSAGES = {
  invalid:
    "リクエストの形式が正しくありません。ページを開き直してもう一度お試しください。",
  tooLong:
    "会話が長くなりすぎました。ページを開き直して、新しい会話を始めてください。",
  messageTooLong: `1 回に送れるメッセージは ${CHAT_REQUEST_LIMITS.maxUserMessageChars.toLocaleString("ja-JP")} 文字までです。短くしてもう一度お試しください。`,
} as const;

const L = CHAT_REQUEST_LIMITS;

const partSchema = z.looseObject({ type: z.string().max(100) });

// 受け取ったメッセージはそのまま使うため、知らない項目は通す（looseObject）。
// 形・件数・長さの確認だけを行う
const messageSchema = z.looseObject({
  id: z.string().max(L.maxIdChars),
  // クライアントから system メッセージは受け付けない（システムプロンプトの差し込みを防ぐ）
  role: z.enum(["user", "assistant"]),
  parts: z.array(partSchema).max(L.maxPartsPerMessage),
});

const requestSchema = z.looseObject({
  messages: z.array(messageSchema).min(1).max(L.maxMessages),
});

const homeBillSchema = z.looseObject({
  id: z.string().max(L.maxIdChars),
  name: z.string().max(L.maxBillNameChars),
  summary: z.string().max(L.maxBillSummaryChars).nullish(),
  tags: z.array(z.string().max(L.maxTagChars)).max(L.maxBillTags).nullish(),
  isFeatured: z.boolean().nullish(),
});

// サーバーが使うのは先頭メッセージの metadata だけ（議案の本文などはサーバー側で
// 取り直す）。システムプロンプトやプロンプト名・DB 検索に入る項目の長さと値を確認する
const firstMessageMetadataSchema = z.looseObject({
  billContext: z
    .looseObject({ id: z.string().max(L.maxIdChars).nullish() })
    .nullish(),
  hasInterviewConfig: z.boolean().nullish(),
  pageContext: z
    .looseObject({
      type: z.enum(["home", "bill"]),
      bills: z.array(homeBillSchema).max(L.maxHomeBills).nullish(),
    })
    .nullish(),
  difficultyLevel: z
    .string()
    .refine((value) =>
      (VALID_DIFFICULTY_LEVELS as readonly string[]).includes(value)
    )
    .nullish(),
  sessionId: z.string().max(L.maxIdChars).nullish(),
});

type MeasurablePart = { type: string; text?: unknown };

/** テキストを持つパーツ（本文・推論）か */
function isTextPart(
  part: MeasurablePart
): part is { type: string; text: string } {
  return (
    (part.type === "text" || part.type === "reasoning") &&
    typeof part.text === "string"
  );
}

/**
 * メッセージ列の大きさを測る。
 * - totalTextChars: 本文（text・reasoning）の合計文字数
 * - totalOtherPartsChars: それ以外のパーツ（ツールの入出力など）を JSON にした合計文字数
 * - longestUserMessageChars: ユーザーメッセージ 1 件あたりの本文の最大文字数
 */
export function measureChatMessages(
  messages: ReadonlyArray<{ role: string; parts: readonly MeasurablePart[] }>
) {
  let totalTextChars = 0;
  let totalOtherPartsChars = 0;
  let longestUserMessageChars = 0;

  for (const message of messages) {
    let messageTextChars = 0;
    for (const part of message.parts) {
      if (isTextPart(part)) {
        messageTextChars += part.text.length;
      } else {
        totalOtherPartsChars += JSON.stringify(part).length;
      }
    }
    totalTextChars += messageTextChars;
    if (message.role === "user") {
      longestUserMessageChars = Math.max(
        longestUserMessageChars,
        messageTextChars
      );
    }
  }

  return { totalTextChars, totalOtherPartsChars, longestUserMessageChars };
}

/**
 * /api/chat のリクエスト本文を検証する。
 * 形式の誤りは 400、件数・長さの超過は 413 と、利用者に見せる日本語のメッセージを返す。
 */
export function validateChatRequestBody(
  body: unknown
): RequestValidationResult<{ messages: UIMessage[] }> {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const status = getStatusFromZodError(parsed.error);
    return failValidation(
      status,
      status === 413
        ? CHAT_REQUEST_ERROR_MESSAGES.tooLong
        : CHAT_REQUEST_ERROR_MESSAGES.invalid
    );
  }

  const messages = parsed.data.messages;

  const metadata = firstMessageMetadataSchema.safeParse(
    (messages[0] as { metadata?: unknown }).metadata ?? {}
  );
  if (!metadata.success) {
    const status = getStatusFromZodError(metadata.error);
    return failValidation(
      status,
      status === 413
        ? CHAT_REQUEST_ERROR_MESSAGES.tooLong
        : CHAT_REQUEST_ERROR_MESSAGES.invalid
    );
  }

  const { totalTextChars, totalOtherPartsChars, longestUserMessageChars } =
    measureChatMessages(messages);

  if (longestUserMessageChars > L.maxUserMessageChars) {
    return failValidation(413, CHAT_REQUEST_ERROR_MESSAGES.messageTooLong);
  }
  if (
    totalTextChars > L.maxTotalTextChars ||
    totalOtherPartsChars > L.maxTotalOtherPartsChars
  ) {
    return failValidation(413, CHAT_REQUEST_ERROR_MESSAGES.tooLong);
  }

  return { success: true, data: { messages: messages as UIMessage[] } };
}
