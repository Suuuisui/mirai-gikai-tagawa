/**
 * Supabase Auth の MFA エラーを、利用者向けの日本語に直す（純粋関数）
 */
type MfaErrorLike = { code?: string | null; message?: string | null } | null;

const MESSAGES: Record<string, string> = {
  mfa_verification_failed:
    "コードが違います。認証アプリに表示されている最新の6桁を入力してください。",
  mfa_verification_rejected:
    "コードが受け付けられませんでした。しばらく待ってからもう一度お試しください。",
  mfa_challenge_expired:
    "確認の有効時間が切れました。もう一度コードを入力してください。",
  mfa_factor_not_found:
    "この設定は無効になりました。ページを開き直して、最初からやり直してください。",
  mfa_totp_enroll_not_enabled:
    "認証アプリの設定が、このサーバーで有効になっていません。管理者に連絡してください。",
  mfa_totp_verify_not_enabled:
    "認証アプリの確認が、このサーバーで有効になっていません。管理者に連絡してください。",
  too_many_enrolled_mfa_factors:
    "登録できる認証アプリの数の上限です。管理者に連絡してください。",
  insufficient_aal:
    "この操作には二段階認証が必要です。いったんログアウトして、ログインし直してください。",
  over_request_rate_limit:
    "試行が多すぎます。しばらく待ってからもう一度お試しください。",
  session_not_found:
    "ログインの有効期限が切れました。ログインし直してください。",
  bad_jwt: "ログインの有効期限が切れました。ログインし直してください。",
};

export function getMfaErrorMessage(
  error: MfaErrorLike,
  fallback = "予期しないエラーが発生しました。もう一度お試しください。"
): string {
  const code = error?.code;
  return (code && MESSAGES[code]) || fallback;
}

/** 6桁の数字だけを取り出す（全角数字・空白・ハイフンを許す） */
export function normalizeTotpCode(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "")
    .slice(0, 6);
}

export function isCompleteTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
