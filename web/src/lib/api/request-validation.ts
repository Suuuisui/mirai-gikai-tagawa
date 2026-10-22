import type { z } from "zod";

/**
 * リクエストの検証に失敗したときの HTTP ステータス
 * - 400: 形式が正しくない（JSON でない、必須項目がない、型が違うなど）
 * - 413: 形式は正しいが大きすぎる（件数・長さが上限を超えた）
 */
export type RequestValidationStatus = 400 | 413;

export type RequestValidationResult<T> =
  | { success: true; data: T }
  | { success: false; status: RequestValidationStatus; message: string };

/**
 * zod の検証エラーを HTTP ステータスに振り分ける。
 * 上限超過（too_big）だけなら 413、形式の誤りが 1 つでもあれば 400。
 */
export function getStatusFromZodError(
  error: z.ZodError
): RequestValidationStatus {
  const onlyTooBig =
    error.issues.length > 0 &&
    error.issues.every((issue) => issue.code === "too_big");
  return onlyTooBig ? 413 : 400;
}

/** 検証に失敗した結果を作る */
export function failValidation(
  status: RequestValidationStatus,
  message: string
): { success: false; status: RequestValidationStatus; message: string } {
  return { success: false, status, message };
}
