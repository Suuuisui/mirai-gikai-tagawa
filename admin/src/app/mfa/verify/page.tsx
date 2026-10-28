import type { Route } from "next";
import { redirect } from "next/navigation";
import { MfaPageShell } from "@/features/auth/client/components/mfa-page-shell";
import { MfaVerifyForm } from "@/features/auth/client/components/mfa-verify-form";
import { getAdminMfaSession } from "@/features/auth/server/lib/auth-server";
import { resolveMfaStep } from "@/lib/auth/mfa";
import { getPostLoginPath } from "@/lib/auth/route-gate";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export default async function MfaVerifyPage() {
  const session = await getAdminMfaSession();
  if (!session) redirect(routes.login());

  const step = resolveMfaStep({
    mfaRequired: env.adminMfaRequired,
    currentLevel: session.currentLevel,
    hasVerifiedTotpFactor: session.hasVerifiedTotpFactor,
  });
  if (step !== "verify") redirect(getPostLoginPath(step) as Route);

  return (
    <MfaPageShell
      title="確認コードの入力"
      description="認証アプリに表示されている6桁のコードを入力してください。"
      email={session.user.email}
    >
      <MfaVerifyForm />
    </MfaPageShell>
  );
}
