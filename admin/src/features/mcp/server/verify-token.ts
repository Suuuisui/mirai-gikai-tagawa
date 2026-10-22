import "server-only";

import { constantTimeEqual } from "@mirai-gikai/shared/security/constant-time-equal";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const MCP_CLIENT_ID = "mirai-gikai-content-agent";

export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  const expected = process.env.ADMIN_MCP_TOKEN;

  if (!expected || expected.length === 0) {
    console.error("ADMIN_MCP_TOKEN is not configured");
    return undefined;
  }

  if (!bearerToken || !constantTimeEqual(bearerToken, expected)) {
    return undefined;
  }

  return {
    token: bearerToken,
    clientId: MCP_CLIENT_ID,
    scopes: ["bills:write", "tags:write"],
  };
}
