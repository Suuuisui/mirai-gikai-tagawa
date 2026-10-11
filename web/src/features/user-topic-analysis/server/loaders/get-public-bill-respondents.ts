import "server-only";

import {
  getPublicBillRespondents as fetchPublicBillRespondents,
  type PublicRespondent,
} from "@mirai-gikai/topic-analysis-core/public-server";
import { cache } from "react";

export type { PublicRespondent };

/**
 * 議案の公開レポート（回答者）を全件取得する。
 * React cache() でリクエスト内のDB呼び出しを重複排除する
 * （generateMetadata とページ本体で同じ billId を取得しても1回のクエリで済む）
 */
export const getPublicBillRespondents = cache(
  (billId: string): Promise<PublicRespondent[]> =>
    fetchPublicBillRespondents(billId)
);
