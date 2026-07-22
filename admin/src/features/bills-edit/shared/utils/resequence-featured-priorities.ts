export type FeaturedPriorityEntry = {
  id: string;
  featured_priority: number | null;
};

export type FeaturedPrioritySaveTarget = {
  id: string;
  is_featured: boolean;
  featured_priority: number | null;
};

/**
 * 現行の優先度順（null は末尾）に並べる。Array.prototype.sort は安定ソートなので、
 * 同順位・null同士は元の並び順が保たれる。
 */
function sortByPriority(
  entries: FeaturedPriorityEntry[]
): FeaturedPriorityEntry[] {
  return [...entries].sort((a, b) => {
    if (a.featured_priority === null && b.featured_priority === null) {
      return 0;
    }
    if (a.featured_priority === null) return 1;
    if (b.featured_priority === null) return -1;
    return a.featured_priority - b.featured_priority;
  });
}

/**
 * 列の並び順どおりに1..Nを振り直し、実際に値が変わる行だけを更新対象として返す。
 */
function toSequencedUpdates(
  entries: FeaturedPriorityEntry[]
): FeaturedPriorityEntry[] {
  return entries
    .map((entry, index) => ({
      id: entry.id,
      featured_priority: index + 1,
      original: entry.featured_priority,
    }))
    .filter((entry) => entry.featured_priority !== entry.original)
    .map(({ id, featured_priority }) => ({ id, featured_priority }));
}

/**
 * 「注目の議案」の表示順（featured_priority）を保存時に自動で1..Nの連番に整列し直す。
 *
 * - 保存対象が featured かつ priority=P を指定した場合: 他の議案を現行priority順
 *   （nullは末尾）に並べた列の位置 P-1 に挿入し、1..Nへ振り直す（Pが列の長さを
 *   超える場合は末尾に挿入したのと同じ結果になる）。
 * - 保存対象が featured で priority が未指定(null)の場合: 列の末尾に追加する。
 * - 保存対象が非featuredの場合: 列から除外して残りを1..Nへ振り直し、保存対象自身は
 *   featured_priority を null にする。
 *
 * 戻り値には、実際に featured_priority が変わる行だけを含める（無駄なUPDATEを避けるため）。
 *
 * @param others 保存対象を除く、現在の注目議案一覧（priority昇順とは限らない）
 * @param target 保存対象の議案
 */
export function resequenceFeaturedPriorities(
  others: FeaturedPriorityEntry[],
  target: FeaturedPrioritySaveTarget
): FeaturedPriorityEntry[] {
  const otherEntries = others.filter((entry) => entry.id !== target.id);
  const sorted = sortByPriority(otherEntries);

  if (!target.is_featured) {
    const updates = toSequencedUpdates(sorted);
    if (target.featured_priority !== null) {
      updates.push({ id: target.id, featured_priority: null });
    }
    return updates;
  }

  if (target.featured_priority === null) {
    return toSequencedUpdates([...sorted, target]);
  }

  const insertIndex = Math.min(
    Math.max(target.featured_priority - 1, 0),
    sorted.length
  );
  const finalOrder = [
    ...sorted.slice(0, insertIndex),
    target,
    ...sorted.slice(insertIndex),
  ];

  return toSequencedUpdates(finalOrder);
}
