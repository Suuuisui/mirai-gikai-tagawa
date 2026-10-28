import { NextResponse } from "next/server";
import { rejectBotRequest } from "@/features/bot-protection/server/utils/reject-bot-request";
import { completeInterviewSessionOnce } from "@/features/interview-session/server/services/complete-interview-session";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import {
  isInvalidOptionalBooleanInput,
  parseOptionalBoolean,
} from "@/features/interview-session/shared/utils/optional-boolean";

/** 完了処理が失敗したときに利用者へ返す固定の文言（詳細はサーバーのログにだけ残す） */
const COMPLETE_FAILED_MESSAGE =
  "インタビューの完了処理に失敗しました。時間をおいて、もう一度お試しください。";

export async function POST(req: Request) {
  // ボットは、本文の読み取りや所有者の確認より先に、モデレーション（LLM 呼び出し）の前に断る
  // （Vercel BotID）。このクライアントは JSON の error を読んで画面に出すので json で返す
  const botRejection = await rejectBotRequest({ format: "json" });
  if (botRejection) {
    return botRejection;
  }

  let body: {
    sessionId?: unknown;
    isPublic?: unknown;
    isDataReuseConsented?: unknown;
  } | null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId, isPublic, isDataReuseConsented } = body ?? {};
  const isPublicByUser = parseOptionalBoolean(isPublic);
  const dataReuseConsented = parseOptionalBoolean(isDataReuseConsented);

  if (typeof sessionId !== "string" || sessionId === "") {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (isInvalidOptionalBooleanInput(isPublic)) {
    return NextResponse.json(
      { error: "Invalid isPublic value" },
      { status: 400 }
    );
  }

  if (isInvalidOptionalBooleanInput(isDataReuseConsented)) {
    return NextResponse.json(
      { error: "Invalid isDataReuseConsented value" },
      { status: 400 }
    );
  }

  const ownershipResult = await verifySessionOwnership(sessionId);
  if (!ownershipResult.authorized) {
    return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
  }

  try {
    // 完了済みのセッションなら、モデレーション（LLM 呼び出し）をやり直さず
    // 既存のレポートを返す
    const report = await completeInterviewSessionOnce({
      sessionId,
      isPublicByUser,
      isDataReuseConsented: dataReuseConsented,
    });

    return NextResponse.json({ report });
  } catch (error) {
    // 詳細（DB のエラー文など）はサーバーのログにだけ残し、利用者には固定の文言を返す
    console.error("Complete interview error:", error);
    return NextResponse.json(
      { error: COMPLETE_FAILED_MESSAGE },
      { status: 500 }
    );
  }
}
