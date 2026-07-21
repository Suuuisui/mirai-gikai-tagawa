import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { DietSession, DietSessionNavItem } from "../../shared/types";

/**
 * 指定日時点で開催中の田川市議会会期を取得
 */
export async function findCurrentDietSession(
  targetDate: string
): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .lte("start_date", targetDate)
    .gte("end_date", targetDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch current diet session: ${error.message}`);
  }

  return data;
}

/**
 * slugで田川市議会会期を取得
 */
export async function findDietSessionBySlug(
  slug: string
): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch diet session by slug: ${error.message}`);
  }

  return data;
}

/**
 * 全ての田川市議会会期を開始日の新しい順に取得
 */
export async function findAllDietSessions(): Promise<DietSession[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all diet sessions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * idで田川市議会会期を取得（会期まとめページ用）
 */
export async function findDietSessionById(
  id: string
): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch diet session by id: ${error.message}`);
  }

  return data;
}

/**
 * 前後の会期ナビゲーション用に、全ての田川市議会会期を開始日の古い順で
 * 軽量な形（id, name, start_date のみ）で取得
 */
export async function findAllDietSessionsForNav(): Promise<
  DietSessionNavItem[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("id, name, start_date")
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch diet sessions for nav: ${error.message}`);
  }

  return data ?? [];
}

/**
 * 指定日時点で既に終了している会期のうち、開始日が最も新しいものを取得する
 * （「前回の田川市議会」プレビュー用）。
 * is_active フラグ（運営が現在フォーカスしている会期を示す手動フラグ）には
 * 依存しない。is_active の更新が新しい会期の追加に追いつかない場合でも、
 * 実際に直近で閉会した会期を正しく返すため。
 */
export async function findMostRecentConcludedDietSession(
  targetDate: string
): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .lt("end_date", targetDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch most recent concluded diet session: ${error.message}`
    );
  }

  return data;
}
