/**
 * 再シード（`clearAllData()` による全消し→CSV再投入）で、admin画面から
 * 設定した「注目の議案」（bills.is_featured / bills.featured_priority）が
 * CSVの初期値（`packages/seed/tagawa/featured-bills-data.ts` 由来）で
 * 上書きされてしまう問題への対応。
 *
 * クリア前に is_featured = true の行を { name, is_featured, featured_priority }
 * としてスナップショットし、インポート後に議案名（bills.name）が一致する
 * 新しい bills 行へ PATCH で復元する。DB側（admin設定）がCSV初期値より優先される。
 *
 * スナップショットが空（初回投入・ローカル新規構築）の場合は何もせず、
 * CSVの FEATURED_BILLS 初期値がそのまま有効になる（呼び出し側でスナップショットが
 * 空なら復元処理自体をスキップする）。
 *
 * ここでは Supabase 等の外部依存を持たない純粋関数のみを扱う。
 * 実際のDBアクセス（スナップショット取得・復元PATCH）は import-csv.ts 側で行う。
 */

export interface FeaturedBillSnapshot {
  name: string;
  is_featured: boolean;
  featured_priority: number | null;
}

export interface NewBillInfo {
  id: string;
  name: string;
}

export interface FeaturedBillUpdate {
  id: string;
  is_featured: boolean;
  featured_priority: number | null;
}

export interface RestoreFeaturedBillsResult {
  restored: FeaturedBillUpdate[];
  skipped: Array<{ name: string; reason: string }>;
}

/**
 * 議案名 -> 新しい bill_id の対応表を作る。
 * 同名の議案が新データ内に複数存在する場合は一意にマッチングできないため、
 * その名前は対応表から除外する（値を null にして「曖昧」を表す）。
 */
function buildNameToNewBillId(
  newBills: NewBillInfo[]
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const bill of newBills) {
    map.set(bill.name, map.has(bill.name) ? null : bill.id);
  }
  return map;
}

/**
 * スナップショットを議案名一致で新しい bill_id に付け替える。
 * - 議案名が一致する新データが無い（議案名が変更された等）→ スキップ
 * - 議案名が新データ内で重複していて一意に決められない → スキップ
 */
export function resolveFeaturedBillUpdates(
  snapshots: FeaturedBillSnapshot[],
  newBills: NewBillInfo[]
): RestoreFeaturedBillsResult {
  const nameToNewBillId = buildNameToNewBillId(newBills);
  const restored: FeaturedBillUpdate[] = [];
  const skipped: RestoreFeaturedBillsResult["skipped"] = [];

  for (const snapshot of snapshots) {
    const newBillId = nameToNewBillId.get(snapshot.name);
    if (newBillId === undefined) {
      skipped.push({
        name: snapshot.name,
        reason: "議案名が一致する新データが見つかりませんでした",
      });
      continue;
    }
    if (newBillId === null) {
      skipped.push({
        name: snapshot.name,
        reason: "同名の議案が複数存在し一意に特定できませんでした",
      });
      continue;
    }
    restored.push({
      id: newBillId,
      is_featured: snapshot.is_featured,
      featured_priority: snapshot.featured_priority,
    });
  }

  return { restored, skipped };
}
