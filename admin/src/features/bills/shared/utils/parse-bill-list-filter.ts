import type { BillListFilter } from "../types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 議案一覧の絞り込み条件をURLクエリから読む。
 * 会期（?dietSession=<diet_session_id>）はUUIDのときだけ採用し、それ以外は
 * 絞り込みなし（null）にする（不正な値をそのままクエリに渡すとDBがエラーを返すため）
 */
export function parseBillListFilter(params: {
  dietSession?: string;
}): BillListFilter {
  const dietSession = params.dietSession;
  return {
    dietSessionId:
      dietSession && UUID_PATTERN.test(dietSession) ? dietSession : null,
  };
}
