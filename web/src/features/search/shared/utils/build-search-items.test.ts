import { describe, expect, it } from "vitest";
import type { BillWithContent } from "@/features/bills/shared/types";
import { buildSearchItems } from "./build-search-items";

function bill(overrides: Partial<BillWithContent>): BillWithContent {
  return {
    id: "bill-1",
    name: "議案第1号 テスト議案",
    status: "enacted",
    submitted_date: "2024-05-01",
    originating_house: "HR",
    publish_status: "published",
    is_featured: false,
    is_review_completed: false,
    member_votes: null,
    tags: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    diet_session_id: null,
    explanation_material_urls: null,
    featured_priority: null,
    knowledge_source: null,
    publish_status_order: null,
    published_at: null,
    share_thumbnail_url: null,
    shugiin_url: null,
    sponsors: null,
    slug: null,
    status_note: null,
    status_order: null,
    thumbnail_url: null,
    use_knowledge_source_in_chat: false,
    ...overrides,
  } as BillWithContent;
}

describe("buildSearchItems", () => {
  it("prefers bill_content.title over bill.name for the title field", () => {
    const bills = [
      bill({ bill_content: { title: "コンテンツタイトル" } as never }),
    ];

    expect(buildSearchItems(bills)[0].title).toBe("コンテンツタイトル");
  });

  it("falls back to bill.name when bill_content is missing", () => {
    const bills = [bill({ name: "議案第2号", bill_content: undefined })];

    expect(buildSearchItems(bills)[0].title).toBe("議案第2号");
  });

  it("truncates summary to 120 characters with an ellipsis", () => {
    const longSummary = "あ".repeat(200);
    const bills = [bill({ bill_content: { summary: longSummary } as never })];

    const result = buildSearchItems(bills)[0].summary;
    expect(result).toHaveLength(121);
    expect(result.endsWith("…")).toBe(true);
  });

  it("returns an empty string when summary is missing", () => {
    const bills = [bill({ bill_content: undefined })];

    expect(buildSearchItems(bills)[0].summary).toBe("");
  });

  it("maps tags to their labels", () => {
    const bills = [
      bill({
        tags: [
          { id: "t1", label: "防災" },
          { id: "t2", label: "教育" },
        ],
      }),
    ];

    expect(buildSearchItems(bills)[0].tags).toEqual(["防災", "教育"]);
  });

  it("carries over id, name, submittedDate, and status as-is", () => {
    const bills = [
      bill({
        id: "bill-xyz",
        name: "議案第9号",
        submitted_date: "2023-09-01",
        status: "rejected",
      }),
    ];

    const result = buildSearchItems(bills)[0];
    expect(result.id).toBe("bill-xyz");
    expect(result.name).toBe("議案第9号");
    expect(result.submittedDate).toBe("2023-09-01");
    expect(result.status).toBe("rejected");
  });
});
