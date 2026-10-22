import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 秘密の文字列（API トークン・共有シークレットなど）を、定数時間で比較する。
 *
 * `===` は先頭から食い違った位置で止まるため、応答時間の差から秘密を一文字ずつ
 * 推測される恐れがある。`timingSafeEqual` は同じ長さの Buffer しか比べられず、
 * 長さが違うと例外になる（長さで先に弾くと、長さの違いが時間に出る）。
 * そこで両方を SHA-256 にかけて常に 32 バイトにそろえてから比べる。
 * ダイジェストが一致すれば元の文字列も（実用上）一致する。
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

/**
 * `Authorization: Bearer <秘密>` ヘッダーが、期待する秘密と一致するかを判定する。
 *
 * - 期待する秘密が未設定（undefined・空文字）のときは、ヘッダーが何であっても false
 *   （「未設定なら誰でも通る」状態にしない）
 * - ヘッダー全体を `Bearer ${秘密}` と定数時間で比べる（スキームの綴りも厳密に一致が必要）
 */
export function isValidBearerToken(
  authorizationHeader: string | null | undefined,
  expectedSecret: string | null | undefined
): boolean {
  if (!expectedSecret || !authorizationHeader) {
    return false;
  }
  return constantTimeEqual(authorizationHeader, `Bearer ${expectedSecret}`);
}
