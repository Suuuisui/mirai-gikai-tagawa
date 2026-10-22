import "server-only";

import { isValidBearerToken } from "@mirai-gikai/shared/security/constant-time-equal";
import { env } from "@/lib/env";

/**
 * 次フェーズのAPI routeを内部fetchで起動する
 *
 * REVALIDATE_SECRET を Bearer token として使用し、
 * env.adminUrl を自己呼び出しURLとして使用する
 */
export async function triggerNextPhase(
  phase: 1 | 2 | 3,
  versionId: string,
  billId: string
): Promise<void> {
  const baseUrl = env.adminUrl;
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    throw new Error(
      "REVALIDATE_SECRET is not configured for internal phase trigger"
    );
  }

  const url = `${baseUrl}/api/topic-analysis/phases/phase${phase}`;

  console.log(`[TopicAnalysis] Triggering phase ${phase}: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ versionId, billId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to trigger phase ${phase}: ${response.status} ${errorText}`
    );
  }
}

/**
 * 内部フェーズAPI routeの認証を検証する
 */
export function verifyInternalAuth(request: Request): void {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    throw new Error("REVALIDATE_SECRET is not configured");
  }

  // 応答時間から秘密を推測されないよう、定数時間で比較する
  const authHeader = request.headers.get("Authorization");
  if (!isValidBearerToken(authHeader, secret)) {
    throw new Error("Unauthorized: Invalid bearer token");
  }
}
