import { describe, expect, it } from "vitest";
import {
  buildInterviewSitemapEntries,
  buildTopicSitemapEntries,
  latestDateByKey,
  latestOf,
  latestQuestionSessionDate,
} from "./sitemap-entries";

const BASE_URL = "https://tagawa-gikai.jp";

describe("latestOf", () => {
  it("文字列と Date が混ざっていても最も新しい日時を返す", () => {
    expect(
      latestOf([
        "2026-10-01T00:00:00.000Z",
        new Date("2026-10-11T04:54:28.362Z"),
        "2026-09-01T00:00:00.000Z",
      ])
    ).toEqual(new Date("2026-10-11T04:54:28.362Z"));
  });

  it("null・undefined・日付として読めない値は無視する", () => {
    expect(latestOf([null, undefined, "不明", "2026-10-01"])).toEqual(
      new Date("2026-10-01")
    );
  });

  it("使える日付が 1 つも無ければ undefined（いまの時刻で埋めない）", () => {
    expect(latestOf([])).toBeUndefined();
    expect(latestOf([null, "不明"])).toBeUndefined();
  });
});

describe("latestDateByKey", () => {
  const bills = [
    { id: "a", sessionId: "s1", tags: ["t1", "t2"], updated_at: "2026-10-01" },
    { id: "b", sessionId: "s1", tags: ["t1"], updated_at: "2026-10-05" },
    { id: "c", sessionId: "s2", tags: [], updated_at: "2026-09-01" },
    { id: "d", sessionId: "s2", tags: ["t2"], updated_at: "不明" },
  ];

  it("キーごとに最も新しい日時を返す", () => {
    const bySession = latestDateByKey(
      bills,
      (bill) => [bill.sessionId],
      (bill) => bill.updated_at
    );
    expect(bySession.get("s1")).toEqual(new Date("2026-10-05"));
    expect(bySession.get("s2")).toEqual(new Date("2026-09-01"));
  });

  it("1 件が複数のキーに属してもよい（タグなど）", () => {
    const byTag = latestDateByKey(
      bills,
      (bill) => bill.tags,
      (bill) => bill.updated_at
    );
    expect(byTag.get("t1")).toEqual(new Date("2026-10-05"));
    expect(byTag.get("t2")).toEqual(new Date("2026-10-01"));
  });

  it("日付が読めない項目と、キーが無い項目は数えない", () => {
    const byTag = latestDateByKey(
      bills,
      (bill) => bill.tags,
      (bill) => bill.updated_at
    );
    expect(byTag.size).toBe(2);
  });
});

describe("buildTopicSitemapEntries", () => {
  const pages = [
    {
      billId: "bill-1",
      generatedAt: "2026-10-01T00:00:00.000Z",
      topicIds: ["topic-a", "topic-b"],
    },
  ];

  it("公開中のトピックがある議案の一覧と、トピックごとの詳細を載せる", () => {
    const entries = buildTopicSitemapEntries({
      baseUrl: BASE_URL,
      pages,
      publishedBillIds: new Set(["bill-1"]),
    });
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://tagawa-gikai.jp/bills/bill-1/topics",
      "https://tagawa-gikai.jp/bills/bill-1/topics/topic-a",
      "https://tagawa-gikai.jp/bills/bill-1/topics/topic-b",
    ]);
    for (const entry of entries) {
      expect(entry.lastModified).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    }
  });

  it("公開されていない議案のトピックは載せない", () => {
    expect(
      buildTopicSitemapEntries({
        baseUrl: BASE_URL,
        pages,
        publishedBillIds: new Set(["other-bill"]),
      })
    ).toEqual([]);
  });

  it("トピックが 1 つも無い議案は載せない", () => {
    expect(
      buildTopicSitemapEntries({
        baseUrl: BASE_URL,
        pages: [{ billId: "bill-1", generatedAt: null, topicIds: [] }],
        publishedBillIds: new Set(["bill-1"]),
      })
    ).toEqual([]);
  });

  it("データが 0 件なら何も足さない", () => {
    expect(
      buildTopicSitemapEntries({
        baseUrl: BASE_URL,
        pages: [],
        publishedBillIds: new Set(["bill-1"]),
      })
    ).toEqual([]);
  });

  it("分析の日時が不明でも項目は作り、lastModified は省く", () => {
    const [list] = buildTopicSitemapEntries({
      baseUrl: BASE_URL,
      pages: [{ billId: "bill-1", generatedAt: null, topicIds: ["topic-a"] }],
      publishedBillIds: new Set(["bill-1"]),
    });
    expect(list.lastModified).toBeUndefined();
  });
});

describe("buildInterviewSitemapEntries", () => {
  it("公開中のインタビューがある議案だけ載せる", () => {
    const entries = buildInterviewSitemapEntries({
      baseUrl: BASE_URL,
      bills: [
        { id: "a", updated_at: "2026-10-01", hasPublicInterview: true },
        { id: "b", updated_at: "2026-10-02", hasPublicInterview: false },
        { id: "c", updated_at: "2026-10-03" },
      ],
    });
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://tagawa-gikai.jp/bills/a/interview",
    ]);
    expect(entries[0].lastModified).toEqual(new Date("2026-10-01"));
  });

  it("公開中のインタビューが無ければ空", () => {
    expect(
      buildInterviewSitemapEntries({
        baseUrl: BASE_URL,
        bills: [{ id: "a", updated_at: "2026-10-01" }],
      })
    ).toEqual([]);
  });
});

describe("latestQuestionSessionDate", () => {
  // 今日（JST）。最初の 3 件の会期は、どれもこの日より前に終わっている
  const today = "2026-10-11";
  const records = [
    { meeting_date: "2026-09-09", updated_at: "2026-09-20T00:00:00.000Z" },
    { meeting_date: "2026-09-11", updated_at: "2026-10-02T00:00:00.000Z" },
    // 別の会期の質問日（範囲外）
    { meeting_date: "2026-06-15", updated_at: "2026-10-09T00:00:00.000Z" },
  ];

  it("質問の最終日と、会期内の記録の更新日時のうち最も新しいものを返す", () => {
    expect(
      latestQuestionSessionDate({
        firstDate: "2026-09-09",
        lastDate: "2026-09-16",
        answerRecords: records,
        today,
      })
    ).toEqual(new Date("2026-10-02T00:00:00.000Z"));
  });

  it("会期の範囲外の記録は数えない", () => {
    expect(
      latestQuestionSessionDate({
        firstDate: "2026-09-09",
        lastDate: "2026-09-16",
        answerRecords: [records[2]],
        today,
      })
    ).toEqual(new Date("2026-09-16"));
  });

  it("質問日が不明な会期は、記録を数えず日付も無ければ undefined", () => {
    expect(
      latestQuestionSessionDate({
        firstDate: null,
        lastDate: null,
        answerRecords: records,
        today,
      })
    ).toBeUndefined();
  });

  describe("会期の初日・最終日ちょうどの記録", () => {
    const base = { firstDate: "2026-09-09", lastDate: "2026-09-16", today };

    it("初日の記録は数え、前日の記録は数えない", () => {
      expect(
        latestQuestionSessionDate({
          ...base,
          answerRecords: [
            {
              meeting_date: "2026-09-09",
              updated_at: "2026-10-05T00:00:00.000Z",
            },
            // 前日（範囲外）の方が新しくても使わない
            {
              meeting_date: "2026-09-08",
              updated_at: "2026-10-09T00:00:00.000Z",
            },
          ],
        })
      ).toEqual(new Date("2026-10-05T00:00:00.000Z"));
    });

    it("最終日の記録は数え、翌日の記録は数えない", () => {
      expect(
        latestQuestionSessionDate({
          ...base,
          answerRecords: [
            {
              meeting_date: "2026-09-16",
              updated_at: "2026-10-05T00:00:00.000Z",
            },
            // 翌日（範囲外）の方が新しくても使わない
            {
              meeting_date: "2026-09-17",
              updated_at: "2026-10-09T00:00:00.000Z",
            },
          ],
        })
      ).toEqual(new Date("2026-10-05T00:00:00.000Z"));
    });
  });

  describe("質問日が今日より後（予定）のとき", () => {
    it("最終日が今日ちょうどなら、最終日を使う", () => {
      expect(
        latestQuestionSessionDate({
          firstDate: "2026-10-09",
          lastDate: today,
          answerRecords: [],
          today,
        })
      ).toEqual(new Date(today));
    });

    it("最終日が明日なら、最終日を使わない（記録も無ければ undefined）", () => {
      expect(
        latestQuestionSessionDate({
          firstDate: "2026-10-09",
          lastDate: "2026-10-12",
          answerRecords: [],
          today,
        })
      ).toBeUndefined();
    });

    it("質問日がすべて未来の会期は、候補が無いので undefined", () => {
      expect(
        latestQuestionSessionDate({
          firstDate: "2026-12-07",
          lastDate: "2026-12-10",
          answerRecords: [],
          today,
        })
      ).toBeUndefined();
    });

    it("最終日が先でも、会期内の記録の更新日時は使い、未来の最終日にはしない", () => {
      const result = latestQuestionSessionDate({
        firstDate: "2026-10-09",
        lastDate: "2026-10-22",
        answerRecords: [
          {
            meeting_date: "2026-10-09",
            updated_at: "2026-10-10T03:00:00.000Z",
          },
        ],
        today,
      });
      expect(result).toEqual(new Date("2026-10-10T03:00:00.000Z"));
    });
  });
});
