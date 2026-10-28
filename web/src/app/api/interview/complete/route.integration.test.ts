import { checkBotId } from "botid/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOT_BLOCKED_MESSAGE } from "@/features/bot-protection/server/utils/reject-bot-request";
import { POST } from "./route";

// BotID は Vercel の外では判定できない（開発・テストでは常に人として扱い、設定不足の警告を出す）。
// 外部サービスの判定だけを固定の結果に差し替え、ルートが判定をどこで呼ぶかを確かめる
vi.mock("botid/server", () => ({ checkBotId: vi.fn() }));

const HUMAN = {
  isHuman: true,
  isBot: false,
  isVerifiedBot: false,
  bypassed: true,
};
const BOT = {
  isHuman: false,
  isBot: true,
  isVerifiedBot: false,
  bypassed: false,
};

beforeEach(() => {
  vi.mocked(checkBotId).mockResolvedValue(HUMAN);
});

function buildCompleteRequest(body: unknown): Request {
  return new Request("http://localhost/api/interview/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/interview/complete", () => {
  it("JSON として読めない本文の場合は400を返す", async () => {
    const res = await POST(
      new Request("http://localhost/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it("sessionId が文字列でない場合は400を返す", async () => {
    const res = await POST(buildCompleteRequest({ sessionId: { id: 1 } }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing sessionId" });
  });

  it("sessionId がない場合は400を返す", async () => {
    const res = await POST(buildCompleteRequest({ isPublic: true }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing sessionId" });
  });

  it("isPublic が boolean 以外の場合は400を返す", async () => {
    const res = await POST(
      buildCompleteRequest({ sessionId: "session-1", isPublic: "true" })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid isPublic value" });
  });

  it("isDataReuseConsented が boolean 以外の場合は400を返す", async () => {
    const res = await POST(
      buildCompleteRequest({
        sessionId: "session-1",
        isPublic: true,
        isDataReuseConsented: "yes",
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Invalid isDataReuseConsented value",
    });
  });

  it("未認証の場合は403を返す", async () => {
    const res = await POST(
      buildCompleteRequest({
        sessionId: "00000000-0000-0000-0000-000000000000",
        isPublic: true,
        isDataReuseConsented: true,
      })
    );

    expect(res.status).toBe(403);
  });

  it("ボットと判定されたら、本文の検証より先に403を返す", async () => {
    vi.mocked(checkBotId).mockResolvedValueOnce(BOT);

    // 人なら 400（Missing sessionId）になる本文でも、ボットは 403
    const res = await POST(buildCompleteRequest({}));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: BOT_BLOCKED_MESSAGE });
  });
});
