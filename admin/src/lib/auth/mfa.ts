/**
 * 管理者の二段階認証（TOTP：認証アプリの 6 桁コード）の判定ロジック（純粋関数）
 *
 * Supabase Auth のセッションには AAL（Authenticator Assurance Level）がある。
 * - aal1: パスワード（や Google）でログインしただけ
 * - aal2: そのうえで認証アプリの 6 桁コードも確認済み
 *
 * 管理画面は aal2 のセッションだけを通す。ここは DB・Cookie・環境変数に触れず、
 * middleware（Edge）・Server・ブラウザのどこからでも同じ判定を使えるようにしてある。
 */

/** 二段階認証の次の手順。none = 済んでいる（または強制していない） */
export type MfaStep = "none" | "enroll" | "verify";

/** Supabase の Factor のうち、判定に使う項目だけ */
type FactorLike = {
  id: string;
  factor_type: string;
  status: string;
};

/**
 * 環境変数 ADMIN_MFA_REQUIRED の読み方。
 *
 * "false" のときだけ強制をやめる。未設定・空文字・それ以外の値はすべて「強制する」。
 * 緊急時に Vercel の環境変数へ打ち込む値なので、大文字小文字（"False"）と前後の
 * 空白は無視する（外れなくて困ることはあっても、誤って外れる方向の揺れは無い）。
 */
export function parseMfaRequired(raw: string | null | undefined): boolean {
  return raw?.trim().toLowerCase() !== "false";
}

/** セッションが aal2（二段階認証まで済み）か */
export function isAal2(level: string | null | undefined): boolean {
  return level === "aal2";
}

/**
 * 二段階認証の要件を満たしているか。
 * 強制していなければ常に満たす。強制しているときは aal2 のセッションだけが満たす
 * （AAL が取れなかった・不明な値のときは満たさない＝閉じる側に倒す）。
 */
export function isMfaSatisfied(input: {
  mfaRequired: boolean;
  currentLevel: string | null | undefined;
}): boolean {
  return !input.mfaRequired || isAal2(input.currentLevel);
}

/** 確認済み（verified）の TOTP 要素だけを取り出す */
export function selectVerifiedTotpFactors<T extends FactorLike>(
  factors: readonly T[] | null | undefined
): T[] {
  return (factors ?? []).filter(
    (factor) => factor.factor_type === "totp" && factor.status === "verified"
  );
}

/** 作りかけ（未確認）の TOTP 要素だけを取り出す。設定をやり直すときに消す対象 */
export function selectUnverifiedTotpFactors<T extends FactorLike>(
  factors: readonly T[] | null | undefined
): T[] {
  return (factors ?? []).filter(
    (factor) => factor.factor_type === "totp" && factor.status !== "verified"
  );
}

/** 確認済みの TOTP 要素があるか */
export function hasVerifiedTotpFactor(
  factors: readonly FactorLike[] | null | undefined
): boolean {
  return selectVerifiedTotpFactors(factors).length > 0;
}

/**
 * 次にどの手順へ進むか。
 * - none: 二段階認証が済んでいる（または強制していない）→ 管理画面へ
 * - verify: 確認済みの要素がある → 6 桁コードを入力する
 * - enroll: 確認済みの要素が無い → 認証アプリの設定から
 */
export function resolveMfaStep(input: {
  mfaRequired: boolean;
  currentLevel: string | null | undefined;
  hasVerifiedTotpFactor: boolean;
}): MfaStep {
  if (isMfaSatisfied(input)) return "none";
  return input.hasVerifiedTotpFactor ? "verify" : "enroll";
}
