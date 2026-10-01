import "server-only";

import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { BillWithContent } from "../../shared/types";
import {
  createBillShareUrl,
  createShareMessage,
} from "../../shared/utils/share";

/**
 * シェアに必要なコンテキスト情報を取得
 *
 * originはリクエストヘッダーではなく環境変数（正規ドメイン）から取る。
 * headers() を使うと動的APIになり、ISR（静的生成）される議案詳細ページが
 * 実行時に DYNAMIC_SERVER_USAGE で500になるため。
 * `@/lib/env` はimport時に他の環境変数を必須検証してテストで落ちるので、
 * ここでは process.env を直接読む
 */
export async function getShareContext(): Promise<{
  origin: string;
  difficulty: DifficultyLevelEnum;
}> {
  const origin = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
  return { origin, difficulty: await getDifficultyLevel() };
}

/**
 * 議案のシェアに必要なすべてのデータを取得
 */
export async function getBillShareData(bill: BillWithContent) {
  const { origin, difficulty } = await getShareContext();

  return {
    shareUrl: createBillShareUrl(origin, bill.id, difficulty),
    shareMessage: createShareMessage(bill),
    // シェア用OGP画像を優先的に使用、なければ通常のサムネイル
    thumbnailUrl: bill.share_thumbnail_url || bill.thumbnail_url,
  };
}
