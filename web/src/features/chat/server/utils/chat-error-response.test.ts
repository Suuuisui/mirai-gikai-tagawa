import { describe, expect, it } from "vitest";
import { ChatError, ChatErrorCode } from "../../shared/types/errors";
import { chatErrorToResponse } from "./chat-error-response";

describe("chatErrorToResponse", () => {
  it("DAILY_COST_LIMIT_REACHED で 429 を返す", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.DAILY_COST_LIMIT_REACHED)
    );
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("本日の利用上限");
  });

  it("SYSTEM_DAILY_COST_LIMIT_REACHED で 429 を返す", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.SYSTEM_DAILY_COST_LIMIT_REACHED)
    );
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("本日の利用上限");
  });

  it("SYSTEM_MONTHLY_COST_LIMIT_REACHED で 429 を返す", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.SYSTEM_MONTHLY_COST_LIMIT_REACHED)
    );
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("今月の利用上限");
  });

  it("COST_LIMIT_CHECK_FAILED で 503 を返す（利用額を確認できないときは止める）", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.COST_LIMIT_CHECK_FAILED)
    );
    expect(res.status).toBe(503);
    expect(await res.text()).toContain("利用状況を確認できない");
  });

  it("INTERVIEW_NOT_AVAILABLE で 404 を返す", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.INTERVIEW_NOT_AVAILABLE)
    );
    expect(res.status).toBe(404);
    expect(await res.text()).toContain(
      "インタビューは現在ご利用いただけません"
    );
  });

  it("その他の ChatError で 500 を返す", async () => {
    const res = chatErrorToResponse(
      new ChatError(ChatErrorCode.PROMPT_FETCH_FAILED)
    );
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("エラーが発生しました");
  });

  it("ChatError 以外のエラーで 500 を返す", async () => {
    const res = chatErrorToResponse(new Error("unexpected"));
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("エラーが発生しました");
  });
});
