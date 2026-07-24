import "server-only";
import { selectTagSectionBills } from "@mirai-gikai/shared/top-page/select-tag-section-bills";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import {
  computeBillInterestScore,
  sortByInterestKey,
} from "../../shared/utils/interest-score";
import { sortBillsTagRowsByDateDesc } from "../../shared/utils/map-bills-tag-rows";

// ============================================================
// Bills
// ============================================================

/**
 * 公開済み議案を難易度コンテンツ付きで取得
 */
export async function findPublishedBillsWithContents(
  difficultyLevel: DifficultyLevelEnum
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      `
      *,
      bill_contents!inner (
        id,
        bill_id,
        title,
        summary,
        content,
        difficulty_level,
        created_at,
        updated_at
      )
    `
    )
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel)
    .order("submitted_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }

  return data;
}

/**
 * 公開済み議案を1件取得
 */
export async function findPublishedBillById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .eq("publish_status", "published")
    .single();

  if (error) {
    // 0件/複数件時のPGRST116は「存在しない」という正常系のため握りつぶす。
    // それ以外（接続断など）は一時的なDB障害の可能性があるためthrowし、
    // unstable_cacheに空結果を焼き付けさせない。
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch bill by id: ${error.message}`);
  }

  return data;
}

/**
 * 管理者用: ステータス問わず議案を1件取得
 */
export async function findBillById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data;
}

/**
 * 議案のmirai_stanceを取得
 */
export async function findMiraiStanceByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mirai_stances")
    .select("*")
    .eq("bill_id", billId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch mirai stance: ${error.message}`);
  }

  return data;
}

/**
 * 議案のタグを取得
 */
export async function findTagsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tags(id, label)")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch tags by bill id: ${error.message}`);
  }

  return data;
}

// ============================================================
// Bill Contents
// ============================================================

/**
 * 指定された難易度の議案コンテンツを取得
 */
export async function findBillContentByDifficulty(
  billId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId)
    .eq("difficulty_level", difficultyLevel)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch bill content: ${error.message}`);
  }

  return data;
}

// ============================================================
// Tags (bulk)
// ============================================================

import { chunk } from "../../shared/utils/chunk";
import { groupTagsByBillId } from "../../shared/utils/group-tags";

// `.in()` にID全件を渡すとGETのクエリ文字列がURI長制限を超えるため
// （全議案611件で発生）、この件数ごとに分割してリクエストする
const IN_CLAUSE_CHUNK_SIZE = 100;

/**
 * 複数のbill_idに紐づくタグを一括取得し、bill_idごとにグループ化して返す
 */
export async function findTagsByBillIds(
  billIds: string[]
): Promise<Map<string, Array<{ id: string; label: string }>>> {
  if (billIds.length === 0) {
    return new Map();
  }

  const supabase = createAdminClient();
  const results = await Promise.all(
    chunk(billIds, IN_CLAUSE_CHUNK_SIZE).map(async (ids) => {
      const { data, error } = await supabase
        .from("bills_tags")
        .select("bill_id, tags(id, label)")
        .in("bill_id", ids);

      if (error) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }

      return data ?? [];
    })
  );

  return groupTagsByBillId(results.flat());
}

// ============================================================
// Diet Session Bills
// ============================================================

/**
 * 田川市議会会期IDに紐づく公開済み議案を取得
 */
export async function findPublishedBillsByDietSession(
  dietSessionId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      `
      *,
      bill_contents!inner (
        id,
        bill_id,
        title,
        summary,
        content,
        difficulty_level,
        created_at,
        updated_at
      )
    `
    )
    .eq("diet_session_id", dietSessionId)
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel)
    .order("status_order", { ascending: true })
    .order("submitted_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch bills by diet session: ${error.message}`);
  }

  return data;
}

/**
 * 前回の田川市議会会期の公開済み議案を取得（興味度スコアの高い順、件数制限あり）。
 * status_order（審議進行度）だけで並べると、否決・不信任決議のような
 * 本当に読み応えのある議案より、人事同意や専決処分報告のような定型の
 * 成立議案が優先されてしまう（status_orderはenactedが最上位のため）。
 * ホームページのタグ別議案一覧と同じ興味度スコアで並べ替え、会期を代表する
 * プレビューとして意味のある議案が上位に来るようにする。
 */
export async function findPreviousSessionBills(
  dietSessionId: string,
  difficultyLevel: DifficultyLevelEnum,
  limit: number
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      `
      *,
      bill_contents!inner (
        id,
        bill_id,
        title,
        summary,
        content,
        difficulty_level,
        created_at,
        updated_at
      )
    `
    )
    .eq("diet_session_id", dietSessionId)
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel);

  if (error) {
    throw new Error(`Failed to fetch previous session bills: ${error.message}`);
  }

  // ソート中に new Date() が複数回呼ばれて時刻がブレないよう、一度だけ取得して使い回す
  const now = new Date();
  const sorted = sortByInterestKey(data ?? [], (bill) => ({
    score: computeBillInterestScore(bill, now),
    submittedDate: bill.submitted_date,
    id: bill.id,
  }));

  return sorted.slice(0, limit);
}

/**
 * 前回の田川市議会会期の公開済み議案数を取得
 */
export async function countPublishedBillsByDietSession(
  dietSessionId: string,
  difficultyLevel: DifficultyLevelEnum
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("bills")
    .select("*, bill_contents!inner(difficulty_level)", {
      count: "exact",
      head: true,
    })
    .eq("diet_session_id", dietSessionId)
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel);

  if (error) {
    throw new Error(`Failed to count previous session bills: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * 全ての田川市議会会期について、公開済み議案数を一括で取得する
 * 会期一覧ページ等、複数会期の件数をまとめて表示する場合に使用（N+1回避）
 */
export async function countPublishedBillsGroupedByDietSession(
  difficultyLevel: DifficultyLevelEnum
): Promise<Map<string, number>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("diet_session_id, bill_contents!inner(difficulty_level)")
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel);

  if (error) {
    throw new Error(
      `Failed to count bills grouped by diet session: ${error.message}`
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.diet_session_id) continue;
    counts.set(row.diet_session_id, (counts.get(row.diet_session_id) ?? 0) + 1);
  }

  return counts;
}

export type DietSessionBillStats = {
  /** 公開済み議案数 */
  billCount: number;
  /** 議員別の賛否データ（member_votes）が登録されている議案の数 */
  splitVoteCount: number;
};

/**
 * 全ての田川市議会会期について、公開済み議案数と賛否が分かれた議案数を
 * 一括で取得する（会期一覧ページ用、N+1回避）
 */
export async function findBillStatsGroupedByDietSession(
  difficultyLevel: DifficultyLevelEnum
): Promise<Map<string, DietSessionBillStats>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(
      "diet_session_id, member_votes, bill_contents!inner(difficulty_level)"
    )
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", difficultyLevel);

  if (error) {
    throw new Error(
      `Failed to fetch bill stats grouped by diet session: ${error.message}`
    );
  }

  const stats = new Map<string, DietSessionBillStats>();
  for (const row of data ?? []) {
    if (!row.diet_session_id) continue;
    const current = stats.get(row.diet_session_id) ?? {
      billCount: 0,
      splitVoteCount: 0,
    };
    current.billCount += 1;
    if (row.member_votes !== null) {
      current.splitVoteCount += 1;
    }
    stats.set(row.diet_session_id, current);
  }

  return stats;
}

// ============================================================
// Featured
// ============================================================

/**
 * featured_priorityが設定されているタグを取得
 */
export async function findFeaturedTags() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, description, featured_priority")
    .not("featured_priority", "is", null)
    .order("featured_priority", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch featured tags: ${error.message}`);
  }

  return data ?? [];
}

/**
 * 特定タグに紐づく公開済み議案を取得（bill_contents + タグ付き）
 * @param limit 取得件数の上限（省略時は全件取得）
 * @param order 並び順。"date"（既定）は議決日の新しい順。"interest" はトップページの
 *   タグ別議案一覧専用で、興味度スコア（interest-score.ts）の高い順に並べる。
 *   タグ詳細ページ等の既存呼び出しは "date" のまま変更しないこと。
 * @param excludeBillIds 除外する議案ID（"注目の議案"セクションと重複させない
 *   ため）。limitで件数を絞る前に除外するため、除外後も指定件数まで埋まる
 */
export async function findPublishedBillsByTag(
  tagId: string,
  difficultyLevel: DifficultyLevelEnum,
  dietSessionId: string | null,
  limit?: number,
  order: "date" | "interest" = "date",
  excludeBillIds?: ReadonlySet<string>
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("bills_tags")
    .select(
      `
      bill_id,
      bills!inner (
        *,
        bill_contents!inner (
          id,
          bill_id,
          title,
          summary,
          content,
          difficulty_level,
          created_at,
          updated_at
        ),
        bills_tags!inner (
          tags (
            id,
            label
          )
        )
      )
    `
    )
    .eq("tag_id", tagId)
    .eq("bills.publish_status", "published")
    .eq("bills.bill_contents.difficulty_level", difficultyLevel);

  if (dietSessionId) {
    query = query.eq("bills.diet_session_id", dietSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch bills for tag: ${error.message}`);
  }

  // bills_tags を起点にした select では referencedTable 指定の .order() が
  // 最上位の行順に反映されないため、取得後にアプリ側で並べ替える。
  // トップページ用の "interest" は、adminのトップページ編集画面のプレビューと
  // 結果がずれないよう、除外→並べ替え→limit を共有関数に集約している
  if (order === "interest") {
    return selectTagSectionBills(data, excludeBillIds ?? new Set(), limit);
  }

  // excludeBillIdsによる除外は、limitで件数を絞る前に行う（後段で除外すると
  // 指定件数に満たなくなり、除外前提でしか成立しないlimitの意味が崩れるため）
  const filtered = excludeBillIds
    ? data.filter((row) => !excludeBillIds.has(row.bill_id))
    : data;

  const sorted = sortBillsTagRowsByDateDesc(filtered);
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * タグを1件取得
 */
export async function findTagById(tagId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, label, description")
    .eq("id", tagId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch tag: ${error.message}`);
  }

  return data;
}

/**
 * 注目の議案を取得（is_featured = true）
 */
export async function findFeaturedBillsWithContents(
  difficultyLevel: DifficultyLevelEnum,
  dietSessionId: string | null
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("bills")
    .select(
      `
      *,
      bill_contents!inner (
        id,
        bill_id,
        title,
        summary,
        content,
        difficulty_level,
        created_at,
        updated_at
      ),
      tags:bills_tags(
        tag:tags(
          id,
          label
        )
      )
    `
    )
    .eq("is_featured", true)
    .eq("bill_contents.difficulty_level", difficultyLevel)
    // 運営が指定した表示順（featured_priority昇順、未設定は末尾）→ 新しい順
    .order("featured_priority", { ascending: true, nullsFirst: false })
    .order("submitted_date", { ascending: false, nullsFirst: false });

  if (dietSessionId) {
    query = query.eq("diet_session_id", dietSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch featured bills: ${error.message}`);
  }

  return data ?? [];
}

// ============================================================
// Coming Soon
// ============================================================

/**
 * Coming Soon議案を取得
 */
export async function findComingSoonBills(dietSessionId: string | null) {
  const supabase = createAdminClient();
  let query = supabase
    .from("bills")
    .select(
      `
      id,
      name,
      originating_house,
      shugiin_url,
      bill_contents (
        title,
        difficulty_level
      )
    `
    )
    .eq("publish_status", "coming_soon")
    .order("created_at", { ascending: false });

  if (dietSessionId) {
    query = query.eq("diet_session_id", dietSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch coming soon bills: ${error.message}`);
  }

  return data ?? [];
}

// ============================================================
// Preview Tokens
// ============================================================

/**
 * プレビュートークンを検証
 */
export async function findPreviewToken(billId: string, token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("preview_tokens")
    .select("expires_at")
    .eq("bill_id", billId)
    .eq("token", token)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// ============================================================
// Interview Status
// ============================================================

/**
 * 複数のbill_idに対して、公開中のインタビュー設定があるかを一括判定
 *
 * status="public" のみで判定する。論理削除（deleted_at）された設定は
 * 削除時に status="closed" へ変更されるため、ここで自然に除外される
 * （softDeleteInterviewConfigRecord 参照）。
 */
export async function findBillIdsWithPublicInterview(
  billIds: string[]
): Promise<Set<string>> {
  if (billIds.length === 0) {
    return new Set();
  }

  const supabase = createAdminClient();
  const results = await Promise.all(
    chunk(billIds, IN_CLAUSE_CHUNK_SIZE).map(async (ids) => {
      const { data, error } = await supabase
        .from("interview_configs")
        .select("bill_id")
        .in("bill_id", ids)
        .eq("status", "public");

      if (error) {
        throw new Error(`Failed to fetch interview configs: ${error.message}`);
      }

      return data ?? [];
    })
  );

  return new Set(results.flat().map((row) => row.bill_id));
}
