import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasVerifiedTotpFactor } from "@/lib/auth/mfa";
import { checkAdminPermission } from "@/lib/auth/permissions";
import { decideAdminRoute } from "@/lib/auth/route-gate";
import { env } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * redirect の応答に、セッション更新で付いた Cookie を引き継ぐ。
 * 引き継がないと、トークンを更新した直後の redirect で新しい Cookie が捨てられ、
 * 次のリクエストが使用済みの古いトークンで更新しようとしてログアウトされうる
 */
function redirectWithCookies(url: URL, from: NextResponse) {
  const response = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  // MCP エンドポイントはBearerトークンで独自認証する。Supabase auth の呼び出しを避けるため
  // updateSession() より前にバイパスする。
  // NOTE: `startsWith("/api/mcp")` だと `/api/mcpfoo` も一致するため、境界を意識した比較にする。
  const pathname = request.nextUrl.pathname;
  if (pathname === "/api/mcp" || pathname.startsWith("/api/mcp/")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, currentLevel } = await updateSession(request);

  // 通す・redirect する・の判断は純粋関数（route-gate.ts）に任せる。
  // ログイン／管理者／二段階認証（AAL2）の確認はここで一括して行う。
  // OAuth コールバック（/api/auth/callback）や二段階認証のページ自体の扱いもそちら
  const decision = decideAdminRoute({
    pathname,
    isAuthenticated: user !== null,
    isAdmin: checkAdminPermission(user),
    mfaRequired: env.adminMfaRequired,
    currentLevel,
    hasVerifiedTotpFactor: hasVerifiedTotpFactor(user?.factors),
  });

  if (decision.type === "next") {
    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse;
  }

  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  // 元のページのクエリは行き先に持ち越さない
  url.search = "";
  if (decision.error) {
    url.searchParams.set("error", decision.error);
  }
  return redirectWithCookies(url, supabaseResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
