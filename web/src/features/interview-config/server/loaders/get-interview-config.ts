import type { Database } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findPublicInterviewConfigByBillId } from "../repositories/interview-config-repository";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

export async function getInterviewConfig(
  billId: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfig(billId);
}

const _getCachedInterviewConfig = unstable_cache(
  async (billId: string): Promise<InterviewConfig | null> => {
    const { data, error } = await findPublicInterviewConfigByBillId(billId);

    if (error) {
      // レコードが存在しない場合はnullを返す（エラーではない）
      if (error.code === "PGRST116") {
        return null;
      }
      // それ以外は一時的なDB障害等の可能性があるためthrowし、
      // 空結果がunstable_cacheに焼き付くのを防ぐ。
      throw new Error(`Failed to fetch interview config: ${error.message}`);
    }

    return data;
  },
  ["interview-config"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
