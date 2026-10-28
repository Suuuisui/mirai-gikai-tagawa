/**
 * admin の middleware が「このリクエストをどうするか」を決める純粋関数
 *
 * 認証の材料（ログイン中か・管理者か・AAL・TOTP 要素の有無）は middleware が
 * Supabase から集めて渡す。ここは副作用を持たず、結果（そのまま通す／どこへ
 * redirect するか）だけを返すので、全パターンをテストで確かめられる。
 *
 * 前提（middleware 側）:
 * - /api/mcp は Bearer トークンで独自に守っているので、Supabase を呼ぶ前に除外済み
 * - Bearer で守る機械向けの API も、cookie のセッションが無ければここで未ログイン扱いに
 *   なる（二段階認証を入れる前から変わらない挙動）
 */
import { routes } from "@/lib/routes";
import { type MfaStep, resolveMfaStep } from "./mfa";

/** OAuth（Google）のコールバック。Route Handler がコードをセッションに換える */
export const AUTH_CALLBACK_PATH = "/api/auth/callback";

export type AdminRouteInput = {
  pathname: string;
  /** Supabase が検証したユーザーがいるか */
  isAuthenticated: boolean;
  /** app_metadata.roles に admin があるか */
  isAdmin: boolean;
  /** ADMIN_MFA_REQUIRED による強制の有無 */
  mfaRequired: boolean;
  /** セッションの AAL（JWT の aal クレーム）。取れなければ null */
  currentLevel: string | null | undefined;
  /** 確認済みの TOTP 要素があるか */
  hasVerifiedTotpFactor: boolean;
};

export type AdminRouteDecision =
  | { type: "next" }
  | { type: "redirect"; pathname: string; error?: "unauthorized" };

const NEXT: AdminRouteDecision = { type: "next" };

function redirectTo(
  pathname: string,
  error?: "unauthorized"
): AdminRouteDecision {
  return error
    ? { type: "redirect", pathname, error }
    : { type: "redirect", pathname };
}

/** 末尾のスラッシュを除く（"/mfa/verify/" と "/mfa/verify" を同じに扱う） */
function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** 二段階認証の手順に対応するページ */
export function getMfaStepPath(step: Exclude<MfaStep, "none">): string {
  return step === "verify" ? routes.mfaVerify() : routes.mfaSetup();
}

/**
 * 管理者がログインしたあとに最初に行くページ。
 * 二段階認証が済んでいれば管理画面、まだなら手順に応じた二段階認証のページ。
 */
export function getPostLoginPath(step: MfaStep): string {
  return step === "none" ? routes.bills() : getMfaStepPath(step);
}

export function decideAdminRoute(input: AdminRouteInput): AdminRouteDecision {
  const pathname = normalizePathname(input.pathname);

  // OAuth コールバックは Route Handler が処理する
  if (pathname === AUTH_CALLBACK_PATH) return NEXT;

  const isLoginPage = pathname === routes.login();

  // 未ログイン: ログインページ以外はログインへ
  if (!input.isAuthenticated) {
    return isLoginPage ? NEXT : redirectTo(routes.login());
  }

  // ログイン済みだが管理者ではない: ログインページは見せる（別のアカウントで入り直せる）。
  // それ以外は権限なしとしてログインへ戻す
  if (!input.isAdmin) {
    return isLoginPage ? NEXT : redirectTo(routes.login(), "unauthorized");
  }

  // ここから先は管理者。二段階認証がどこまで済んでいるかで行き先が決まる
  const step = resolveMfaStep(input);

  // 済んでいる管理者がログインページを開いたら管理画面へ。
  // 途中の管理者は二段階認証のページへ
  if (isLoginPage) return redirectTo(getPostLoginPath(step));

  // 二段階認証のページは、その手順が必要なときだけ開ける。
  // 手順が違えば正しい方へ、済んでいれば管理画面へ
  if (pathname === routes.mfaSetup()) {
    return step === "enroll" ? NEXT : redirectTo(getPostLoginPath(step));
  }
  if (pathname === routes.mfaVerify()) {
    return step === "verify" ? NEXT : redirectTo(getPostLoginPath(step));
  }

  // 保護されたパス: 二段階認証が済んでいなければ、手順に応じたページへ
  return step === "none" ? NEXT : redirectTo(getMfaStepPath(step));
}
