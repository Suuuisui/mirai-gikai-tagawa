import { initBotId } from "botid/client/core";
import { BOT_PROTECTED_ROUTES } from "@/features/bot-protection/shared/protected-routes";

// Next.js 15.3 以降は、アプリのコードより先にブラウザで実行される。
// Vercel BotID: 守る API（AI を呼ぶ API）へのリクエストにだけ、人かボットかを判定するための
// ヘッダーを付ける。判定はサーバー側（各 route.ts の rejectBotRequest）で行う
initBotId({ protect: [...BOT_PROTECTED_ROUTES] });
