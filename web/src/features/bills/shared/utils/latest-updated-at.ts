/**
 * 議案配列の中で最も新しい updated_at を返す。
 * sitemapのlastModified等、議案データの更新状況を反映した日付を
 * 追加クエリなしで求める用途を想定している。
 * 配列が空の場合はfallbackをそのまま返す
 */
export function getLatestUpdatedAt(
  bills: readonly { updated_at: string }[],
  fallback: Date
): Date {
  if (bills.length === 0) {
    return fallback;
  }

  return bills.reduce((latest, bill) => {
    const updatedAt = new Date(bill.updated_at);
    return updatedAt > latest ? updatedAt : latest;
  }, new Date(0));
}
