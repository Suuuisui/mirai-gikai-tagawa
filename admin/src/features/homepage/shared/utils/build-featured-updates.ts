/**
 * トップページ編集画面の保存時に、DBへ書き込む差分を組み立てる純粋関数群。
 * 並び順は配列の順番＝表示順（1始まりの連番）として扱う。
 */

export type FeaturedBillUpdate = {
  id: string;
  is_featured: boolean;
  featured_priority: number | null;
};

/**
 * 「注目の議案」の保存差分を組み立てる。
 * - orderedIds に入っている議案 → is_featured=true, featured_priority=位置(1始まり)
 * - 現在featuredだが orderedIds から外れた議案 → is_featured=false, priority=null
 * 現在の状態と変わらない議案は更新対象に含めない（無駄な書き込みをしない）。
 */
export function buildFeaturedBillUpdates(
  current: ReadonlyArray<{ id: string; featured_priority: number | null }>,
  orderedIds: readonly string[]
): FeaturedBillUpdate[] {
  const currentPriorityById = new Map(
    current.map((bill) => [bill.id, bill.featured_priority])
  );
  const orderedIdSet = new Set(orderedIds);

  const updates: FeaturedBillUpdate[] = [];

  orderedIds.forEach((id, index) => {
    const priority = index + 1;
    const isAlreadyFeaturedAtSamePosition =
      currentPriorityById.has(id) && currentPriorityById.get(id) === priority;
    if (!isAlreadyFeaturedAtSamePosition) {
      updates.push({ id, is_featured: true, featured_priority: priority });
    }
  });

  for (const bill of current) {
    if (!orderedIdSet.has(bill.id)) {
      updates.push({
        id: bill.id,
        is_featured: false,
        featured_priority: null,
      });
    }
  }

  return updates;
}

export type FeaturedTagUpdate = {
  id: string;
  featured_priority: number | null;
};

/**
 * タグ別セクションの保存差分を組み立てる。
 * - orderedIds に入っているタグ → featured_priority=位置(1始まり)
 * - それ以外のタグで featured_priority が設定されているもの → null（非表示化）
 * 現在の状態と変わらないタグは更新対象に含めない。
 */
export function buildFeaturedTagUpdates(
  current: ReadonlyArray<{ id: string; featured_priority: number | null }>,
  orderedIds: readonly string[]
): FeaturedTagUpdate[] {
  const currentPriorityById = new Map(
    current.map((tag) => [tag.id, tag.featured_priority])
  );
  const orderedIdSet = new Set(orderedIds);

  const updates: FeaturedTagUpdate[] = [];

  orderedIds.forEach((id, index) => {
    const priority = index + 1;
    if (currentPriorityById.get(id) !== priority) {
      updates.push({ id, featured_priority: priority });
    }
  });

  for (const tag of current) {
    if (!orderedIdSet.has(tag.id) && tag.featured_priority !== null) {
      updates.push({ id: tag.id, featured_priority: null });
    }
  }

  return updates;
}
