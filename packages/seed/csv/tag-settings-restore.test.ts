import { describe, expect, it } from "vitest";
import {
  type NewTagInfo,
  resolveTagSettingsUpdates,
  type TagSettingsSnapshot,
} from "./tag-settings-restore";

const newTag = (
  id: string,
  label: string,
  description: string | null = null,
  featured_priority: number | null = null
): NewTagInfo => ({ id, label, description, featured_priority });

const snapshot = (
  label: string,
  description: string | null,
  featured_priority: number | null
): TagSettingsSnapshot => ({ label, description, featured_priority });

describe("resolveTagSettingsUpdates", () => {
  it("ラベル一致で新しいタグIDに復元する", () => {
    const result = resolveTagSettingsUpdates(
      [snapshot("予算", "adminで書いた説明", 5)],
      [newTag("t1", "予算", "CSVの説明", 1)]
    );
    expect(result.restored).toEqual([
      { id: "t1", description: "adminで書いた説明", featured_priority: 5 },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("ラベルが一致しないスナップショットはスキップして理由を返す", () => {
    const result = resolveTagSettingsUpdates(
      [snapshot("旧タグ名", null, 3)],
      [newTag("t1", "予算")]
    );
    expect(result.restored).toEqual([]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].label).toBe("旧タグ名");
  });

  it("新タグ側と設定値が同じ場合は更新対象に含めない", () => {
    const result = resolveTagSettingsUpdates(
      [snapshot("予算", "同じ説明", 1)],
      [newTag("t1", "予算", "同じ説明", 1)]
    );
    expect(result.restored).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it("nullの設定（表示対象外への変更）も復元できる", () => {
    const result = resolveTagSettingsUpdates(
      [snapshot("予算", null, null)],
      [newTag("t1", "予算", "CSVの説明", 1)]
    );
    expect(result.restored).toEqual([
      { id: "t1", description: null, featured_priority: null },
    ]);
  });

  it("スナップショットが空なら何もしない", () => {
    const result = resolveTagSettingsUpdates([], [newTag("t1", "予算")]);
    expect(result.restored).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it("複数タグの混在（復元・スキップ・変更なし）を正しく仕分ける", () => {
    const result = resolveTagSettingsUpdates(
      [
        snapshot("予算", null, 9),
        snapshot("消えたタグ", "x", 2),
        snapshot("条例", "同じ", 3),
      ],
      [newTag("t1", "予算", null, 1), newTag("t2", "条例", "同じ", 3)]
    );
    expect(result.restored).toEqual([
      { id: "t1", description: null, featured_priority: 9 },
    ]);
    expect(result.skipped.map((s) => s.label)).toEqual(["消えたタグ"]);
  });
});
