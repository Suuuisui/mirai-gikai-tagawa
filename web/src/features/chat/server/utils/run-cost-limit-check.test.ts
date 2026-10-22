import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatError, ChatErrorCode } from "../../shared/types/errors";
import { runCostLimitCheck } from "./run-cost-limit-check";

describe("runCostLimitCheck", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("チェックが成功したらその結果を返す", async () => {
    await expect(runCostLimitCheck(async () => "ok")).resolves.toBe("ok");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("上限超過の ChatError はそのまま（同じコードで）投げ直す", async () => {
    const limitError = new ChatError(ChatErrorCode.DAILY_COST_LIMIT_REACHED);

    await expect(
      runCostLimitCheck(async () => {
        throw limitError;
      })
    ).rejects.toBe(limitError);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("チェック自体が失敗したら、続行せず COST_LIMIT_CHECK_FAILED で止める", async () => {
    const promise = runCostLimitCheck(async () => {
      throw new Error("Failed to sum chat usage cost: connection refused");
    });

    await expect(promise).rejects.toBeInstanceOf(ChatError);
    await expect(promise).rejects.toMatchObject({
      code: ChatErrorCode.COST_LIMIT_CHECK_FAILED,
      message: "Failed to sum chat usage cost: connection refused",
    });
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("Error でない値が投げられても COST_LIMIT_CHECK_FAILED にする", async () => {
    await expect(
      runCostLimitCheck(async () => {
        throw "timeout";
      })
    ).rejects.toMatchObject({
      code: ChatErrorCode.COST_LIMIT_CHECK_FAILED,
      message: "timeout",
    });
  });
});
