import type { Route } from "next";
import { redirect } from "next/navigation";
import { MfaPageShell } from "@/features/auth/client/components/mfa-page-shell";
import { MfaSetupForm } from "@/features/auth/client/components/mfa-setup-form";
import { getAdminMfaSession } from "@/features/auth/server/lib/auth-server";
import { resolveMfaStep } from "@/lib/auth/mfa";
import { getPostLoginPath } from "@/lib/auth/route-gate";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export default async function MfaSetupPage() {
  const session = await getAdminMfaSession();
  if (!session) redirect(routes.login());

  // 設定が必要なのは「確認済みの要素がまだ無い」ときだけ。それ以外は正しい行き先へ
  const step = resolveMfaStep({
    mfaRequired: env.adminMfaRequired,
    currentLevel: session.currentLevel,
    hasVerifiedTotpFactor: session.hasVerifiedTotpFactor,
  });
  if (step !== "enroll") redirect(getPostLoginPath(step) as Route);

  return (
    <MfaPageShell
      title="二段階認証の設定"
      description="管理画面を守るため、パスワードに加えて認証アプリの6桁コードを使います。最初の1回だけ設定してください。"
      email={session.user.email}
    >
      <MfaSetupForm />
    </MfaPageShell>
  );
}
