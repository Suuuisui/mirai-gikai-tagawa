import { describe, expect, it } from "vitest";
import {
  groupMeetingsByCommittee,
  sourceTypeLabel,
  toStringArray,
} from "./committee-meeting-parser";

describe("toStringArray", () => {
  it("文字列配列はそのまま返す", () => {
    expect(toStringArray(["a", "b"])).toEqual(["a", "b"]);
  });

  it("配列でない値は空配列にする", () => {
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray("text")).toEqual([]);
    expect(toStringArray({ a: 1 })).toEqual([]);
  });

  it("配列内の非文字列要素は除外する", () => {
    expect(toStringArray(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });
});

describe("groupMeetingsByCommittee", () => {
  it("委員会名ごとに出現順でグループ化する", () => {
    const meetings = [
      { committee_name: "A委員会", id: 1 },
      { committee_name: "B委員会", id: 2 },
      { committee_name: "A委員会", id: 3 },
    ];
    const result = groupMeetingsByCommittee(meetings);
    expect(result).toEqual([
      {
        committeeName: "A委員会",
        meetings: [
          { committee_name: "A委員会", id: 1 },
          { committee_name: "A委員会", id: 3 },
        ],
      },
      {
        committeeName: "B委員会",
        meetings: [{ committee_name: "B委員会", id: 2 }],
      },
    ]);
  });

  it("空配列は空のグループ一覧になる", () => {
    expect(groupMeetingsByCommittee([])).toEqual([]);
  });
});

describe("sourceTypeLabel", () => {
  it("出典種別に応じたラベルを返す", () => {
    expect(sourceTypeLabel("disclosure")).toBe("情報開示請求で入手した文書");
    expect(sourceTypeLabel("youtube")).toBe("公式YouTube中継の自動字幕");
  });
});
