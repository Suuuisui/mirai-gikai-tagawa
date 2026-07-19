import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { DietSession, DietSessionNavItem } from "../../shared/types";

/**
 * アクティブな田川市議会会期を取得
 */
export async function findActiveDietSession(): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    // maybeSingle()は0件時に error を返さないため、ここに到達するのは
    // 接続断等の実エラーのみ。握りつぶさずthrowしてキャッシュ焼き付けを防ぐ。
    throw new Error(`Failed to fetch active diet session: ${error.message}`);
  }

  return data;
}

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
 * 指定日より前の直近の田川市議会会期を取得
 */
export async function findPreviousDietSession(
  beforeStartDate: string
): Promise<DietSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .lt("start_date", beforeStartDate)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch previous diet session: ${error.message}`);
  }

  return data;
}
