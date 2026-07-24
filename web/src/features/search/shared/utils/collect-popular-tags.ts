import type { SearchItem } from "../types";

/**
 * 検索対象の議案からタグを出現数の多い順に集計する
 *
 * 検索ページの初期状態（クエリ未入力）で「タグから探す」導線を
 * 表示するために使う。出現数が同じ場合はタグ名（コードポイント順）で
 * 安定させる。
 */
export function collectPopularTags(
  items: SearchItem[],
  limit: number
): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(([aTag, aCount], [bTag, bCount]) =>
      bCount !== aCount ? bCount - aCount : aTag < bTag ? -1 : 1
    )
    .slice(0, limit)
    .map(([tag]) => tag);
}
