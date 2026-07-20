import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getComingSoonBills } from "./get-coming-soon-bills";
import { getFeaturedBills } from "./get-featured-bills";
import { getPreviousSessionBills } from "./get-previous-session-bills";

/**
 * トップページ用のデータを並列取得する
 * BFF (Backend For Frontend) パターン
 *
 * 「注目の議案」セクションに表示する議案は、直下のタグ別セクションと重複
 * 表示させないため、先にfeaturedBillsを確定させてからそのIDを
 * getBillsByFeaturedTagsに渡して除外する（タグ側のDB取得より前に除外する
 * ことで、BILLS_PER_TAG件の表示件数が除外後も埋まった状態を保つ）
 */
export async function loadHomeData() {
  const [featuredBills, comingSoonBills, previousSessionData] =
    await Promise.all([
      getFeaturedBills(),
      getComingSoonBills(),
      getPreviousSessionBills(),
    ]);

  const featuredBillIds = featuredBills.map((bill) => bill.id);
  const billsByTag = await getBillsByFeaturedTags(featuredBillIds);

  return {
    billsByTag,
    featuredBills,
    comingSoonBills,
    previousSessionData,
  };
}
