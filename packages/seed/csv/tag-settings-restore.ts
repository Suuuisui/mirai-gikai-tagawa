/**
 * 再シード（全消し→CSV再投入）で、admin画面から編集したタグ設定
 * （tags.featured_priority / tags.description）がCSV初期値で上書きされて
 * しまう問題への対応。
 *
 * クリア前に全タグの { label, description, featured_priority } を
 * スナップショットし、インポート後にラベル一致で新しい tags 行へ復元する。
 * DB側（admin設定）がCSV初期値より優先される。
 *
 * ラベル一致しないスナップショット（タグ名を変更した場合等）はスキップして
 * 警告する。スナップショットが空（初回投入）の場合は何もしない。
 *
 * ここでは外部依存を持たない純粋関数のみを扱う。DBアクセスは import-csv.ts 側。
 */

export interface TagSettingsSnapshot {
  label: string;
  description: string | null;
  featured_priority: number | null;
}

export interface NewTagInfo {
  id: string;
  label: string;
  description: string | null;
  featured_priority: number | null;
}

export interface TagSettingsUpdate {
  id: string;
  description: string | null;
  featured_priority: number | null;
}

export interface RestoreTagSettingsResult {
  restored: TagSettingsUpdate[];
  skipped: Array<{ label: string; reason: string }>;
}

/**
 * スナップショットをラベル一致で新しい tags 行に付け替える。
 * - ラベルが一致する新タグが無い → スキップ
 * - 新タグ側と設定値（description / featured_priority）が同じ → 更新不要のため除外
 */
export function resolveTagSettingsUpdates(
  snapshots: TagSettingsSnapshot[],
  newTags: NewTagInfo[]
): RestoreTagSettingsResult {
  const labelToNewTag = new Map(newTags.map((tag) => [tag.label, tag]));
  const restored: TagSettingsUpdate[] = [];
  const skipped: RestoreTagSettingsResult["skipped"] = [];

  for (const snapshot of snapshots) {
    const newTag = labelToNewTag.get(snapshot.label);
    if (!newTag) {
      skipped.push({
        label: snapshot.label,
        reason: "ラベルが一致する新データが見つかりませんでした",
      });
      continue;
    }
    if (
      newTag.description === snapshot.description &&
      newTag.featured_priority === snapshot.featured_priority
    ) {
      continue;
    }
    restored.push({
      id: newTag.id,
      description: snapshot.description,
      featured_priority: snapshot.featured_priority,
    });
  }

  return { restored, skipped };
}
