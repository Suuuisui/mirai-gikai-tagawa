import { describe, expect, it, vi } from "vitest";
import {
  type BillForInterestScore,
  computeBillInterestScore,
  isHotTopicBill,
  sortBillsTagRowsByInterestDesc,
  sortByInterestKey,
} from "./interest-score";

// 実際の呼び出し元（findPublishedBillsByTag）はBillの全カラムを含む重い型を返すが、
// このテストでは純粋関数のロジック検証に必要な最小限のフィールドのみを渡す。
// submitted_date は既定で新しさボーナス圏外（実行時刻によらず常に800日超前）にしておき、
// 加点・減点ルールの単体テストが新しさボーナスの影響を受けないようにする。
const FAR_PAST_SUBMITTED_DATE = "2000-01-01";

/** 実行時点から指定日数前の日付文字列（YYYY-MM-DD）を返す。now依存の統合テスト用 */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function createBill(
  overrides: Partial<BillForInterestScore> = {}
): BillForInterestScore {
  return {
    status_note: null,
    name: "第1号議案 田川市一般会計補正予算（第1号）",
    is_featured: false,
    explanation_material_urls: null,
    submitted_date: FAR_PAST_SUBMITTED_DATE,
    bill_contents: undefined,
    ...overrides,
  };
}

describe("computeBillInterestScore", () => {
  it("加点要素が何もない議案は0点になる", () => {
    expect(computeBillInterestScore(createBill())).toBe(0);
  });

  it("status_note が「否決」を含む場合は+50", () => {
    const score = computeBillInterestScore(createBill({ status_note: "否決" }));
    expect(score).toBe(50);
  });

  it("status_note が「不認定」「継続審議」等でも異例議決として+50", () => {
    expect(
      computeBillInterestScore(createBill({ status_note: "不認定" }))
    ).toBe(50);
    expect(
      computeBillInterestScore(createBill({ status_note: "継続審議" }))
    ).toBe(50);
  });

  it("is_featured が true の場合は+30", () => {
    const score = computeBillInterestScore(createBill({ is_featured: true }));
    expect(score).toBe(30);
  });

  it("content に「反対討論」を含む場合は+25", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: {
          title: "",
          summary: "",
          content: "反対討論が行われた",
        },
      })
    );
    expect(score).toBe(25);
  });

  it("content に「賛成多数」を含む場合も+25", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: { title: "", summary: "", content: "賛成多数で可決" },
      })
    );
    expect(score).toBe(25);
  });

  it("content に「## 議会での主な論点」を含む場合は+15", () => {
    const score = computeBillInterestScore(
      createBill({
        bill_contents: {
          title: "",
          summary: "",
          content: "## 議会での主な論点\n本文",
        },
      })
    );
    expect(score).toBe(15);
  });

  it("name/title に「一般会計予算」を含み「補正」を含まない場合は+10（当初予算）", () => {
    const score = computeBillInterestScore(
      createBill({ name: "第1号議案 田川市一般会計予算" })
    );
    expect(score).toBe(10);
  });

  it("「一般会計予算」を含んでいても「補正」も含む場合は加点しない", () => {
    const score = computeBillInterestScore(
      createBill({ name: "第1号議案 田川市一般会計補正予算（第1号）" })
    );
    expect(score).toBe(0);
  });

  it("name+title+summary に生活密着キーワードを含む場合は+8", () => {
    const score = computeBillInterestScore(
      createBill({
        name: "学校給食センター条例の一部を改正する条例",
      })
    );
    expect(score).toBe(8);
  });

  it("explanation_material_urls が1件以上の配列の場合は+2", () => {
    const score = computeBillInterestScore(
      createBill({
        explanation_material_urls: [
          { label: "説明資料", url: "https://example.com/a.pdf" },
        ],
      })
    );
    expect(score).toBe(2);
  });

  it("explanation_material_urls が空配列や不正な形式の場合は加点しない", () => {
    expect(
      computeBillInterestScore(createBill({ explanation_material_urls: [] }))
    ).toBe(0);
    expect(
      computeBillInterestScore(
        createBill({ explanation_material_urls: [{ foo: "bar" }] })
      )
    ).toBe(0);
  });

  it("name が定型議案パターン（任命・選任など）にマッチする場合は-15", () => {
    expect(
      computeBillInterestScore(
        createBill({
          name: "教育委員会委員の任命につき同意を求めることについて",
        })
      )
    ).toBe(-15);
    expect(
      computeBillInterestScore(
        createBill({ name: "専決処分の承認を求めることについて" })
      )
    ).toBe(-15);
  });

  it("複数の加点・減点ルールが同時に適用される場合は合算される", () => {
    const score = computeBillInterestScore(
      createBill({
        status_note: "否決",
        is_featured: true,
        bill_contents: {
          title: "",
          summary: "",
          content: "反対討論が行われ、## 議会での主な論点\n本文",
        },
      })
    );
    // 50(否決) + 30(featured) + 25(討論) + 15(論点解説)
    expect(score).toBe(120);
  });

  it("submitted_date から400日以内（now基準）の場合は新しさボーナス+15", () => {
    // 2025-06-01 -> 2026-07-01 は395日後
    const score = computeBillInterestScore(
      createBill({ submitted_date: "2025-06-01" }),
      new Date("2026-07-01")
    );
    expect(score).toBe(15);
  });

  it("submitted_date から400日超800日以内（now基準）の場合は新しさボーナス+8", () => {
    // 2024-06-01 -> 2026-07-01 は760日後
    const score = computeBillInterestScore(
      createBill({ submitted_date: "2024-06-01" }),
      new Date("2026-07-01")
    );
    expect(score).toBe(8);
  });

  it("submitted_date から800日を超える（now基準）場合は新しさボーナスなし", () => {
    const score = computeBillInterestScore(
      createBill({ submitted_date: "2020-01-01" }),
      new Date("2026-07-01")
    );
    expect(score).toBe(0);
  });

  it("submitted_date が null の場合は新しさボーナスなし", () => {
    const score = computeBillInterestScore(
      createBill({ submitted_date: null }),
      new Date("2026-07-01")
    );
    expect(score).toBe(0);
  });
});

describe("isHotTopicBill", () => {
  const FIXED_NOW = new Date("2026-07-21");

  /** FIXED_NOW から指定日数前のISO日付文字列（YYYY-MM-DD）を返す */
  function isoDaysBefore(days: number): string {
    return new Date(FIXED_NOW.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  it("直近（30日前）に否決された議案は話題議案として扱う", () => {
    const bill = createBill({
      status_note: "否決",
      submitted_date: isoDaysBefore(30),
    });

    expect(isHotTopicBill(bill, FIXED_NOW)).toBe(true);
  });

  it("古い（200日前）否決議案はスコアが高くても話題議案として扱わない（令和6年度決算のケース）", () => {
    const bill = createBill({
      status_note: "否決",
      submitted_date: isoDaysBefore(200),
    });

    // 200日前は興味度スコア自体は50超だが、HOT_TOPIC_WINDOW_DAYS(90日)を
    // 超えているため「今まさに話題」とは扱わない
    expect(computeBillInterestScore(bill, FIXED_NOW)).toBeGreaterThan(50);
    expect(isHotTopicBill(bill, FIXED_NOW)).toBe(false);
  });

  it("直近でもスコアが閾値を超えない議案（加点要素なし）は話題議案として扱わない", () => {
    const bill = createBill({
      submitted_date: isoDaysBefore(30),
    });

    expect(isHotTopicBill(bill, FIXED_NOW)).toBe(false);
  });

  it("submitted_date が null の場合は話題議案として扱わない", () => {
    const bill = createBill({
      status_note: "否決",
      submitted_date: null,
    });

    expect(isHotTopicBill(bill, FIXED_NOW)).toBe(false);
  });
});

describe("sortByInterestKey", () => {
  // Bill型に依存しない汎用関数であることを示すため、最小限の
  // { id, score, date } だけを持つダミー型でテストする
  type Item = { id: string; score: number; date: string | null };
  const toKey = (item: Item) => ({
    score: item.score,
    submittedDate: item.date,
    id: item.id,
  });

  it("スコアの降順に並べ替える", () => {
    const result = sortByInterestKey(
      [
        { id: "low", score: 10, date: null },
        { id: "high", score: 50, date: null },
      ],
      toKey
    );

    expect(result.map((item) => item.id)).toEqual(["high", "low"]);
  });

  it("スコアが同点の場合は submittedDate の新しい順（null末尾）で並べ替える", () => {
    const result = sortByInterestKey(
      [
        { id: "no-date", score: 10, date: null },
        { id: "old", score: 10, date: "2010-01-01" },
        { id: "new", score: 10, date: "2020-01-01" },
      ],
      toKey
    );

    expect(result.map((item) => item.id)).toEqual(["new", "old", "no-date"]);
  });

  it("スコアも日付も同点の場合は id の昇順で安定化する", () => {
    const result = sortByInterestKey(
      [
        { id: "b", score: 10, date: "2010-01-01" },
        { id: "a", score: 10, date: "2010-01-01" },
      ],
      toKey
    );

    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("元の配列を変更しない", () => {
    const original = [
      { id: "b", score: 10, date: "2010-01-01" },
      { id: "a", score: 20, date: "2015-01-01" },
    ];
    const originalCopy = [...original];

    sortByInterestKey(original, toKey);

    expect(original).toEqual(originalCopy);
  });

  it("toKey は要素ごとに1回だけ呼び出す（コンパレータ内での再計算を避ける）", () => {
    const toKeySpy = vi.fn(toKey);

    sortByInterestKey(
      [
        { id: "a", score: 10, date: null },
        { id: "b", score: 20, date: null },
        { id: "c", score: 30, date: null },
      ],
      toKeySpy
    );

    expect(toKeySpy).toHaveBeenCalledTimes(3);
  });
});

describe("sortBillsTagRowsByInterestDesc", () => {
  it("スコア降順に並べ替える", () => {
    const result = sortBillsTagRowsByInterestDesc([
      {
        bills: {
          ...createBill(),
          id: "bill-low",
        },
      },
      {
        bills: {
          ...createBill({ status_note: "否決" }),
          id: "bill-high",
        },
      },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["bill-high", "bill-low"]);
  });

  it("新しい注目議案が古い注目議案より上に来る（新しさボーナス）", () => {
    const recentFeaturedBill = {
      bills: {
        ...createBill({ is_featured: true, submitted_date: daysAgo(10) }),
        id: "recent-featured",
      },
    };
    const oldFeaturedBill = {
      bills: {
        ...createBill({ is_featured: true, submitted_date: "2015-01-01" }),
        id: "old-featured",
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      oldFeaturedBill,
      recentFeaturedBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "recent-featured",
      "old-featured",
    ]);
  });

  it("直近の定型議案が古い否決議案より上に来る（バケット優先・統合ケース）", () => {
    const rejectedOldBill = {
      bills: {
        ...createBill({
          status_note: "否決",
          name: "工事請負契約の締結について",
        }),
        id: "rejected-old",
        submitted_date: "2015-03-01",
      },
    };
    const routineNewBill = {
      bills: {
        ...createBill({
          name: "教育委員会委員の任命につき同意を求めることについて",
        }),
        id: "routine-new",
        submitted_date: daysAgo(30),
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      rejectedOldBill,
      routineNewBill,
    ]);

    // スコアだけならrejected-old(50点)がroutine-new(0点)より高いが、
    // 直近バケット優先のため新しいroutine-newが古いrejected-oldより上に来る
    expect(result.map((r) => r.bills?.id)).toEqual([
      "routine-new",
      "rejected-old",
    ]);
  });

  it("両方とも直近の場合はスコアの高い否決議案が定型議案より上に来る", () => {
    const rejectedRecentBill = {
      bills: {
        ...createBill({
          status_note: "否決",
          name: "工事請負契約の締結について",
        }),
        id: "rejected-recent",
        submitted_date: daysAgo(30),
      },
    };
    const routineRecentBill = {
      bills: {
        ...createBill({
          name: "教育委員会委員の任命につき同意を求めることについて",
        }),
        id: "routine-recent",
        submitted_date: daysAgo(30),
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      routineRecentBill,
      rejectedRecentBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "rejected-recent",
      "routine-recent",
    ]);
  });

  it("直近の低スコア議案が古い高スコア議案より上に来る（バケット優先）", () => {
    const oldHighScoreBill = {
      bills: {
        ...createBill({ status_note: "否決" }),
        id: "old-high-score",
        submitted_date: "2015-01-01",
      },
    };
    const recentLowScoreBill = {
      bills: {
        ...createBill(),
        id: "recent-low-score",
        submitted_date: daysAgo(30),
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      oldHighScoreBill,
      recentLowScoreBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "recent-low-score",
      "old-high-score",
    ]);
  });

  it("両方とも直近の場合はスコア順で並べ替える", () => {
    const recentHighScoreBill = {
      bills: {
        ...createBill({ status_note: "否決" }),
        id: "recent-high-score",
        submitted_date: daysAgo(30),
      },
    };
    const recentLowScoreBill = {
      bills: {
        ...createBill(),
        id: "recent-low-score",
        submitted_date: daysAgo(60),
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      recentLowScoreBill,
      recentHighScoreBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "recent-high-score",
      "recent-low-score",
    ]);
  });

  it("両方とも古い場合はスコア順で並べ替える", () => {
    const oldHighScoreBill = {
      bills: {
        ...createBill({ status_note: "否決" }),
        id: "old-high-score",
        submitted_date: "2015-01-01",
      },
    };
    const oldLowScoreBill = {
      bills: {
        ...createBill(),
        id: "old-low-score",
        submitted_date: "2010-01-01",
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      oldLowScoreBill,
      oldHighScoreBill,
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual([
      "old-high-score",
      "old-low-score",
    ]);
  });

  it("submitted_date が null の議案は古いバケット扱いになる", () => {
    const nullDateBill = {
      bills: {
        ...createBill({ status_note: "否決", submitted_date: null }),
        id: "null-date",
      },
    };
    const recentLowScoreBill = {
      bills: {
        ...createBill(),
        id: "recent-low-score",
        submitted_date: daysAgo(30),
      },
    };

    const result = sortBillsTagRowsByInterestDesc([
      nullDateBill,
      recentLowScoreBill,
    ]);

    // null-dateはスコアが高くても古いバケット扱いのため、
    // 直近バケットのrecent-low-scoreが上に来る
    expect(result.map((r) => r.bills?.id)).toEqual([
      "recent-low-score",
      "null-date",
    ]);
  });

  it("スコアが同点の場合は submitted_date の新しい順（null末尾）", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: { ...createBill(), id: "b", submitted_date: null } },
      { bills: { ...createBill(), id: "a", submitted_date: "2010-06-01" } },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["a", "b"]);
  });

  it("スコアも日付も同点の場合は id の昇順で安定化する", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: { ...createBill(), id: "b", submitted_date: "2010-01-01" } },
      { bills: { ...createBill(), id: "a", submitted_date: "2010-01-01" } },
    ]);

    expect(result.map((r) => r.bills?.id)).toEqual(["a", "b"]);
  });

  it("bills が null の行は末尾に回す", () => {
    const result = sortBillsTagRowsByInterestDesc([
      { bills: null },
      { bills: { ...createBill(), id: "a" } },
    ]);

    expect(result.map((r) => r.bills?.id ?? null)).toEqual(["a", null]);
  });

  it("元の配列を変更しない", () => {
    const original = [
      { bills: { ...createBill(), id: "b", submitted_date: "2010-01-01" } },
      { bills: { ...createBill(), id: "a", submitted_date: "2015-01-01" } },
    ];
    const originalCopy = [...original];

    sortBillsTagRowsByInterestDesc(original);

    expect(original).toEqual(originalCopy);
  });
});
