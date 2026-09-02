import { describe, expect, it } from "vitest";
import {
  COMMITTEE_TOPICS,
  countMeetingsByTopic,
  isCommitteeTopicId,
  resolveTopics,
} from "./committee-topics";

describe("isCommitteeTopicId", () => {
  it("定義済みのidを受け入れる", () => {
    expect(isCommitteeTopicId("money")).toBe(true);
  });

  it("未定義のidは弾く", () => {
    expect(isCommitteeTopicId("sports")).toBe(false);
  });
});

describe("resolveTopics", () => {
  it("idからトピック定義を引く", () => {
    expect(resolveTopics(["waste"]).map((t) => t.label)).toEqual([
      "ごみ・環境",
    ]);
  });

  it("未定義のidは黙って捨てる", () => {
    expect(resolveTopics(["money", "unknown"]).map((t) => t.id)).toEqual([
      "money",
    ]);
  });

  it("同じidが重複しても1つにまとめる", () => {
    expect(resolveTopics(["money", "money"])).toHaveLength(1);
  });
});

describe("countMeetingsByTopic", () => {
  it("トピックごとの会議数をCOMMITTEE_TOPICSの順で返す", () => {
    const result = countMeetingsByTopic([
      { topics: ["welfare", "money"] },
      { topics: ["money"] },
    ]);

    expect(result.map((entry) => [entry.topic.id, entry.count])).toEqual([
      ["money", 2],
      ["welfare", 1],
    ]);
  });

  it("1件も無いトピックは含めない", () => {
    const result = countMeetingsByTopic([{ topics: ["money"] }]);

    expect(result).toHaveLength(1);
  });

  it("同じ会議に同じトピックが重複していても1件として数える", () => {
    const result = countMeetingsByTopic([{ topics: ["money", "money"] }]);

    expect(result[0].count).toBe(1);
  });

  it("未定義のidは数えない", () => {
    expect(countMeetingsByTopic([{ topics: ["unknown"] }])).toEqual([]);
  });
});

describe("COMMITTEE_TOPICS", () => {
  it("idが重複していない", () => {
    const ids = COMMITTEE_TOPICS.map((topic) => topic.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
