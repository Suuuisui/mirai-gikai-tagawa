import "server-only";

import type { User } from "@supabase/supabase-js";
import { hasVerifiedTotpFactor, isMfaSatisfied } from "@/lib/auth/mfa";
import { checkAdminPermission } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { createAuthClient } from "@/lib/supabase/auth";

export type AdminMfaSession = {
  user: User;
  /** セッションの AAL（aal2 = 二段階認証まで済み）。取れなければ null */
  currentLevel: string | null;
  hasVerifiedTotpFactor: boolean;
};

/**
 * 管理者ロールのあるユーザーと、二段階認証の状態を返す。AAL は強制しない。
 *
 * ⚠️ 二段階認証のページ（app/mfa/**）専用。ここを通った人は aal1（パスワードだけ）
 * かもしれない。ページ・Server Action・API ルートでは必ず getCurrentAdmin() /
 * requireAdmin() を使うこと（admin-guard-coverage.test.ts が使える場所を限っている）。
 */
export async function getAdminMfaSession(): Promise<AdminMfaSession | null> {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.getUser();

  if (!user || !checkAdminPermission(user)) {
    return null;
  }

  // getUser() が Supabase にトークンを検証させたあと、同じトークンの aal クレームを
  // 読むだけなので信頼できる。取れなければ null（＝二段階認証が済んでいない扱い）
  const { data } = await authClient.mfa.getAuthenticatorAssuranceLevel();

  return {
    user,
    currentLevel: data?.currentLevel ?? null,
    hasVerifiedTotpFactor: hasVerifiedTotpFactor(user.factors),
  };
}

type AdminCheck =
  | { status: "ok"; user: User }
  | { status: "not-admin" }
  | { status: "mfa-required" };

async function checkAdmin(): Promise<AdminCheck> {
  const session = await getAdminMfaSession();
  if (!session) return { status: "not-admin" };

  if (
    !isMfaSatisfied({
      mfaRequired: env.adminMfaRequired,
      currentLevel: session.currentLevel,
    })
  ) {
    return { status: "mfa-required" };
  }
  return { status: "ok", user: session.user };
}

/**
 * 現在のユーザーが管理者権限を持ち、二段階認証（AAL2）まで済んでいるかチェックする
 * @returns 条件を満たす管理者の場合はuser、そうでない場合はnull
 */
export async function getCurrentAdmin() {
  const result = await checkAdmin();
  return result.status === "ok" ? result.user : null;
}

/**
 * 現在のユーザーが管理者としてログインし、二段階認証まで済んでいるかチェックする
 * そうでない場合はエラーを投げる
 */
export async function requireAdmin() {
  const result = await checkAdmin();

  if (result.status === "not-admin") {
    throw new Error("管理者権限が必要です");
  }
  if (result.status === "mfa-required") {
    throw new Error("二段階認証が必要です。ログインし直してください");
  }

  return result.user;
}
