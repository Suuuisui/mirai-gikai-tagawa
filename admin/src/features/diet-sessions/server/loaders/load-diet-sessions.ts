import type { DietSession } from "../../shared/types";
import { findAllDietSessions } from "../repositories/diet-session-repository";

/** 全会期を開会日の新しい順で返す（一覧・セレクトで最新の会期が先頭に来る） */
export async function loadDietSessions(): Promise<DietSession[]> {
  const data = await findAllDietSessions();
  return data || [];
}
