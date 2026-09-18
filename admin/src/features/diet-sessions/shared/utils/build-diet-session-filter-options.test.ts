import { describe, expect, it } from "vitest";
import {
  ALL_DIET_SESSIONS,
  buildDietSessionFilterOptions,
} from "./build-diet-session-filter-options";

describe("buildDietSessionFilterOptions", () => {
  it("先頭に「すべての会期」を置き、渡された順に会期を並べる", () => {
    const options = buildDietSessionFilterOptions([
      { id: "s2", name: "令和8年（第6回）9月定例会", is_active: false },
      { id: "s1", name: "令和8年（第5回）8月臨時会", is_active: false },
    ]);

    expect(options).toEqual([
      { value: ALL_DIET_SESSIONS, label: "すべての会期" },
      { value: "s2", label: "令和8年（第6回）9月定例会" },
      { value: "s1", label: "令和8年（第5回）8月臨時会" },
    ]);
  });

  it("アクティブな会期にだけ「（アクティブ）」を添える", () => {
    const options = buildDietSessionFilterOptions([
      { id: "s3", name: "令和8年（第7回）12月定例会", is_active: false },
      { id: "s2", name: "令和8年（第6回）9月定例会", is_active: true },
      { id: "s1", name: "令和8年（第5回）8月臨時会", is_active: false },
    ]);

    expect(options.slice(1).map((option) => option.label)).toEqual([
      "令和8年（第7回）12月定例会",
      "令和8年（第6回）9月定例会（アクティブ）",
      "令和8年（第5回）8月臨時会",
    ]);
  });

  it("会期が無くても「すべての会期」だけは返す", () => {
    expect(buildDietSessionFilterOptions([])).toEqual([
      { value: ALL_DIET_SESSIONS, label: "すべての会期" },
    ]);
  });
});
