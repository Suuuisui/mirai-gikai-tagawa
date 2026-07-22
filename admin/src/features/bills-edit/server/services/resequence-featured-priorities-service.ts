import "server-only";

import { resequenceFeaturedPriorities } from "../../shared/utils/resequence-featured-priorities";
import {
  findFeaturedBillPriorities,
  updateBillFeaturedPriorities,
} from "../repositories/bill-edit-repository";

/**
 * 議案の保存後に「注目の議案」の表示順（featured_priority）を1..Nの連番へ
 * 自動整列する。保存対象を除く注目議案一覧を取得し、純粋関数
 * resequenceFeaturedPriorities で再計算した上で、値が変わる行だけをDB更新する。
 *
 * 呼び出し元（create-bill / update-bill-with-side-effects）で、保存済みの
 * 議案の is_featured / featured_priority を渡すこと。
 */
export async function resequenceFeaturedPrioritiesAfterSave(target: {
  id: string;
  is_featured: boolean;
  featured_priority: number | null;
}): Promise<void> {
  const others = await findFeaturedBillPriorities(target.id);
  const updates = resequenceFeaturedPriorities(others, target);

  if (updates.length === 0) return;

  await updateBillFeaturedPriorities(updates);
}
