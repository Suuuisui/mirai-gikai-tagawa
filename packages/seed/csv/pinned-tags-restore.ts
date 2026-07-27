/**
 * 再シード（全消し→CSV再投入）で、admin画面から設定したタグ枠の
 * ピン留め（bills_tags.pinned_priority）が消えてしまう問題への対応。
 *
 * クリア前に「タグラベル + 議案マッチキー（会期slug::議案名）+ 順位」を
 * スナップショットし、インポート後に新しい bills_tags 行へ復元する。
 *
 * タグラベル・議案名の変更や、タグ付け自体が外れた場合は復元できないため
 * スキップして警告する。スナップショットが空（初回投入）の場合は何もしない。
 *
 * ここでは外部依存を持たない純粋関数のみを扱う。DBアクセスは import-csv.ts 側。
 */

export interface PinnedTagSnapshot {
  tagLabel: string;
  /** billMatchKey（会期slug::議案名。interview-restore.tsと同じキー） */
  billMatchKey: string;
  pinned_priority: number;
}

export interface PinnedTagUpdate {
  tag_id: string;
  bill_id: string;
  pinned_priority: number;
}

export interface RestorePinnedTagsResult {
  restored: PinnedTagUpdate[];
  skipped: Array<{ tagLabel: string; billMatchKey: string; reason: string }>;
}

/** bills_tagsの (tag_id, bill_id) ペアを一意に表すキー */
export function billsTagsLinkKey(tagId: string, billId: string): string {
  return `${tagId}::${billId}`;
}

/**
 * スナップショットを新しい tags / bills / bills_tags 行に付け替える。
 * - タグラベルが一致する新タグが無い → スキップ
 * - 議案マッチキーが一致する新議案が無い → スキップ
 * - 新データで議案にそのタグが付いていない（bills_tags行が無い） → スキップ
 */
export function resolvePinnedTagUpdates(
  snapshots: PinnedTagSnapshot[],
  newTags: Array<{ id: string; label: string }>,
  matchKeyToNewBillId: ReadonlyMap<string, string>,
  existingLinkKeys: ReadonlySet<string>
): RestorePinnedTagsResult {
  const labelToNewTagId = new Map(newTags.map((tag) => [tag.label, tag.id]));
  const restored: PinnedTagUpdate[] = [];
  const skipped: RestorePinnedTagsResult["skipped"] = [];

  for (const snapshot of snapshots) {
    const tagId = labelToNewTagId.get(snapshot.tagLabel);
    if (!tagId) {
      skipped.push({
        tagLabel: snapshot.tagLabel,
        billMatchKey: snapshot.billMatchKey,
        reason: "ラベルが一致する新タグが見つかりませんでした",
      });
      continue;
    }

    const billId = matchKeyToNewBillId.get(snapshot.billMatchKey);
    if (!billId) {
      skipped.push({
        tagLabel: snapshot.tagLabel,
        billMatchKey: snapshot.billMatchKey,
        reason: "会期slug::議案名が一致する新議案が見つかりませんでした",
      });
      continue;
    }

    if (!existingLinkKeys.has(billsTagsLinkKey(tagId, billId))) {
      skipped.push({
        tagLabel: snapshot.tagLabel,
        billMatchKey: snapshot.billMatchKey,
        reason: "新データではこの議案にタグが付いていません",
      });
      continue;
    }

    restored.push({
      tag_id: tagId,
      bill_id: billId,
      pinned_priority: snapshot.pinned_priority,
    });
  }

  return { restored, skipped };
}
