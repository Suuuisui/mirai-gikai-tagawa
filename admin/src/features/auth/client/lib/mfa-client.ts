import "client-only";
import {
  hasVerifiedTotpFactor,
  resolveMfaStep,
  selectUnverifiedTotpFactors,
  selectVerifiedTotpFactors,
} from "@/lib/auth/mfa";
import { getPostLoginPath } from "@/lib/auth/route-gate";
import { routes } from "@/lib/routes";
import { getMfaErrorMessage } from "../../shared/utils/mfa-error-message";
import { authClient } from "./auth-client";

/** 認証アプリに表示される名前（「名前:メールアドレス」の形で並ぶ） */
const TOTP_ISSUER = "みらい議会＠田川市 管理画面";

export type TotpEnrollment = {
  factorId: string;
  /** QR コード（SVG の data URI。<img src> にそのまま使える） */
  qrCode: string;
  /** QR が読めないときに手で入力するキー */
  secret: string;
};

function fail(
  error: { code?: string | null } | null,
  fallback?: string
): never {
  throw new Error(getMfaErrorMessage(error, fallback));
}

/**
 * 認証アプリの設定を始める。
 * 前回途中でやめた（未確認の）要素が残っていると名前が衝突したり、使えない QR が
 * 溜まるので、先に消してから作り直す。名前は毎回ユニークにする
 */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  const { data: factors, error: listError } =
    await authClient.mfa.listFactors();
  if (listError || !factors) fail(listError);

  for (const factor of selectUnverifiedTotpFactors(factors.all)) {
    const { error } = await authClient.mfa.unenroll({ factorId: factor.id });
    if (error) fail(error);
  }

  const { data, error } = await authClient.mfa.enroll({
    factorType: "totp",
    issuer: TOTP_ISSUER,
    friendlyName: `admin-${Date.now()}`,
  });
  if (error || !data) fail(error);

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** 設定中の要素に 6 桁コードを送って確認する（成功すると aal2 のセッションになる） */
export async function verifyEnrollment(factorId: string, code: string) {
  const { error } = await authClient.mfa.challengeAndVerify({ factorId, code });
  if (error) fail(error);
}

/**
 * ログイン時の 6 桁コード確認。確認済みの要素を順に試す
 * （通常は 1 つだけ。複数あっても、どれかの認証アプリのコードで通る）
 */
export async function verifyLoginCode(code: string) {
  const { data, error: listError } = await authClient.mfa.listFactors();
  if (listError || !data) fail(listError);

  const factors = selectVerifiedTotpFactors(data.all);
  if (factors.length === 0) {
    throw new Error(
      "確認できる認証アプリがありません。ページを開き直してください。"
    );
  }

  let lastError: { code?: string | null } | null = null;
  for (const factor of factors) {
    const { error } = await authClient.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    if (!error) return;
    lastError = error;
  }
  fail(lastError);
}

/**
 * パスワードログイン直後の行き先。AAL と確認済みの要素を見て、設定ページ・
 * 確認ページ・管理画面のどれかを返す。
 * 緊急スイッチ（ADMIN_MFA_REQUIRED=false）はサーバーの環境変数でブラウザには
 * 見えないので、ここでは「強制している」前提で決める。スイッチが入っていれば
 * middleware が管理画面へ戻す。見られなかったときも管理画面を指し、middleware に任せる
 */
export async function resolvePostLoginPath(): Promise<string> {
  const [aal, factors] = await Promise.all([
    authClient.mfa.getAuthenticatorAssuranceLevel(),
    authClient.mfa.listFactors(),
  ]);
  if (aal.error || factors.error || !factors.data) return routes.bills();

  return getPostLoginPath(
    resolveMfaStep({
      mfaRequired: true,
      currentLevel: aal.data?.currentLevel ?? null,
      hasVerifiedTotpFactor: hasVerifiedTotpFactor(factors.data.all),
    })
  );
}
