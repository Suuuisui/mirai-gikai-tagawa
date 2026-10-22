import { ChatError, ChatErrorCode } from "../../shared/types/errors";

/**
 * 利用額の上限チェックを実行する（fail-closed）。
 *
 * 上限を超えているときは、チェックが投げる ChatError（日次・月次の上限超過）をそのまま通す。
 * チェック自体が失敗したとき（DB への接続エラーなど）は、上限を守れているか分からないため
 * 処理を続けず、COST_LIMIT_CHECK_FAILED の ChatError にして止める。
 * 以前は「失敗したらログだけ残して続行」としていたため、DB の不調の間は
 * 上限なしで AI を使い放題になっていた。
 */
export async function runCostLimitCheck<T>(
  check: () => Promise<T>
): Promise<T> {
  try {
    return await check();
  } catch (error) {
    if (error instanceof ChatError) {
      throw error;
    }
    console.error("Cost limit check error:", error);
    throw new ChatError(
      ChatErrorCode.COST_LIMIT_CHECK_FAILED,
      error instanceof Error ? error.message : String(error)
    );
  }
}
