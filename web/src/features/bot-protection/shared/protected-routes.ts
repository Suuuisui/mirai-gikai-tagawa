/**
 * Vercel BotID で守る API の一覧（AI を呼ぶ API）。
 *
 * - クライアント（`src/instrumentation-client.ts`）は、この一覧に合うリクエストにだけ
 *   「人かボットか」を判定するためのヘッダーを付ける
 * - サーバー（各 `route.ts` の先頭で呼ぶ `rejectBotRequest`）は、そのヘッダーを見て判定する
 *
 * 片方だけ直すと、一覧に無いのにサーバーで判定している API は、ヘッダーが付かないので
 * 全リクエストがボット扱いになって AI が使えなくなる。逆に一覧にあるのにサーバーで判定していない API は、
 * 守られないまま素通りになる。2 つが合っているかは `protected-routes.test.ts` が検査する。
 *
 * 守る API を足すときは、ここに 1 行足し、その `route.ts` の先頭で `rejectBotRequest` を呼ぶ。
 * 判定の水準（checkLevel）は指定しない（プロジェクトの設定＝無料の Basic のまま）。
 */
export const BOT_PROTECTED_ROUTES = [
  { path: "/api/chat", method: "POST" },
  { path: "/api/interview/chat", method: "POST" },
  { path: "/api/interview/complete", method: "POST" },
] as const;

export type BotProtectedRoute = (typeof BOT_PROTECTED_ROUTES)[number];
