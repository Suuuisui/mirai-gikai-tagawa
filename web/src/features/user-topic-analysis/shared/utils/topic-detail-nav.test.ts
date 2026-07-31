import { describe, expect, it } from "vitest";
import type { PublicTopic } from "../types";
import {
  buildTopicNavByFilter,
  topicDetailBreadcrumbItems,
} from "./topic-detail-nav";

function makeTopic(
  id: string,
  overrides: Partial<PublicTopic> = {}
): PublicTopic {
  return {
    id,
    title: `topic-${id}`,
    description: "",
    opinion_count: 0,
    affected_count: 0,
    industry_count: 0,
    expert_count: 0,
    citizen_count: 0,
    sentiment: { 期待: 0, 懸念: 0 },
    opinions: [],
    ...overrides,
  };
}

describe("buildTopicNavByFilter", () => {
  const topics = [
    makeTopic("a", { industry_count: 2 }),
    makeTopic("b", { industry_count: 0 }),
    makeTopic("c", { industry_count: 5 }),
  ];

  it("all は元の並びで位置と前後を返す", () => {
    expect(buildTopicNavByFilter(topics, "b")?.all).toEqual({
      position: 2,
      total: 3,
      prevTopicId: "a",
      nextTopicId: "c",
    });
  });

  it("フィルタ適用後の並び（件数降順）で位置と前後を返す", () => {
    expect(buildTopicNavByFilter(topics, "a")?.industry).toEqual({
      position: 2,
      total: 2,
      prevTopicId: "c",
      nextTopicId: null,
    });
  });

  it("フィルタ後の集合に無いトピックは全件の並びで算出する", () => {
    expect(buildTopicNavByFilter(topics, "b")?.industry).toEqual({
      position: 2,
      total: 3,
      prevTopicId: "a",
      nextTopicId: "c",
    });
  });

  it("全フィルタ分のキーを持つ", () => {
    const nav = buildTopicNavByFilter(topics, "a");
    expect(nav && Object.keys(nav).sort()).toEqual(
      [
        "all",
        "affected",
        "citizen",
        "expert",
        "industry",
        "期待",
        "懸念",
      ].sort()
    );
  });

  it("存在しないIDは null", () => {
    expect(buildTopicNavByFilter(topics, "x")).toBeNull();
  });
});

describe("topicDetailBreadcrumbItems", () => {
  it("フィルタ無し（all）は素のラベル", () => {
    expect(topicDetailBreadcrumbItems("bill-1", "all")).toEqual([
      { label: "議案詳細", href: "/bills/bill-1" },
      { label: "トピック一覧", href: "/bills/bill-1/topics" },
      { label: "トピック詳細" },
    ]);
  });

  it("フィルタ指定時は一覧ラベルにフィルタ名を併記する", () => {
    const items = topicDetailBreadcrumbItems("bill-1", "industry");
    expect(items[1]).toEqual({
      label: "トピック一覧（事業者）",
      href: "/bills/bill-1/topics",
    });
  });
});
