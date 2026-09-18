import type { DietSessionFilterSource } from "../types";

/** 会期の絞り込みを外す選択肢の値（URLに載せる場合はパラメータ自体を消す） */
export const ALL_DIET_SESSIONS = "all";

/**
 * 会期で絞り込むセレクトの選択肢を組み立てる。
 * 先頭は「すべての会期」、以降は渡された順（開会日の新しい順を想定）に並べ、
 * アクティブな会期（会期管理画面で「アクティブ」バッジが付く会期）には
 * 名前の後ろに「（アクティブ）」を添える
 */
export function buildDietSessionFilterOptions(
  sessions: readonly DietSessionFilterSource[]
): { value: string; label: string }[] {
  return [
    { value: ALL_DIET_SESSIONS, label: "すべての会期" },
    ...sessions.map((session) => ({
      value: session.id,
      label: session.is_active ? `${session.name}（アクティブ）` : session.name,
    })),
  ];
}
