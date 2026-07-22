import type { Bill } from "../types";
import { isDefaultThumbnail } from "./bill-cover";
import { resolveBillShareImageUrl } from "./bill-share-image";

/**
 * 議案詳細ページ（bills/[id]）のOGP画像URLを解決する。
 *
 * - share_thumbnail_url・thumbnail_url のどちらも未設定（＝カテゴリ共通の
 *   デフォルトサムネイルのまま）の議案は、BillCoverと同じデザインを動的生成する
 *   `/api/og/bills/{id}` を返す。
 * - どちらかに個別の画像が設定されている議案は resolveBillShareImageUrl の結果
 *   （= 既存のシェア画像URL）をそのまま維持する。
 */
export function resolveBillOgImageUrl(
  bill:
    | Pick<Bill, "id" | "share_thumbnail_url" | "thumbnail_url">
    | null
    | undefined,
  webUrl: string
): string {
  const hasCustomImage =
    !!bill?.share_thumbnail_url ||
    !isDefaultThumbnail(bill?.thumbnail_url ?? null);

  if (bill && !hasCustomImage) {
    return new URL(`/api/og/bills/${bill.id}`, webUrl).toString();
  }

  return resolveBillShareImageUrl(bill, webUrl);
}
