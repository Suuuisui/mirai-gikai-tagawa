import { describe, expect, it } from "vitest";
import {
  countCharacters,
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
} from "@/lib/seo/page-description";
import { COMMITTEE_PROFILES } from "../data/committee-profiles";
import type { CommitteeMeetingListItem } from "../types";
import {
  buildCommitteeGroupDescription,
  buildCommitteeGroupJsonLd,
  buildCommitteeGroupTitle,
  buildCommitteeMeetingDescription,
  buildCommitteeMeetingJsonLd,
  buildCommitteeMeetingTitle,
} from "./committee-seo";

// summary は 3 文でちょうど 120 字（description の上限いっぱい）
const meeting = {
  committee_name: "本会議",
  meeting_date: "2026-10-08",
  headline: "令和7年度一般会計決算を不認定、ほか5会計は認定",
  summary:
    "令和8年10月8日の本会議（9月定例会の最終日）では、令和7年度決算6件の委員長報告と採決が行われました。認定第1号の一般会計決算は、総務文教委員会と厚生委員会が不認定、建設経済委員会が認定と報告。採決の結果は起立多数で不認定となりました。",
  updated_at: "2026-10-11T04:54:28.362Z",
};

describe("buildCommitteeMeetingTitle", () => {
  it("見出し、会議名、和暦の日付の順に並べる", () => {
    expect(buildCommitteeMeetingTitle(meeting)).toBe(
      "令和7年度一般会計決算を不認定、ほか5会計は認定｜田川市議会 本会議（令和8年10月8日）"
    );
  });

  it("見出しが無い記録は、会議名と日付だけの題名にする", () => {
    expect(buildCommitteeMeetingTitle({ ...meeting, headline: null })).toBe(
      "田川市議会 本会議（令和8年10月8日）の記録"
    );
  });

  it("見出しが空文字の記録も、会議名と日付だけの題名にする", () => {
    expect(buildCommitteeMeetingTitle({ ...meeting, headline: "" })).toBe(
      "田川市議会 本会議（令和8年10月8日）の記録"
    );
  });

  it("同じ委員会・同じ見出しでも、日付が違えば題名が違う", () => {
    const a = buildCommitteeMeetingTitle({ ...meeting, headline: "事務報告" });
    const b = buildCommitteeMeetingTitle({
      ...meeting,
      headline: "事務報告",
      meeting_date: "2026-09-14",
    });
    expect(a).not.toBe(b);
  });

  it("和暦にできない日付は元の文字列を使う", () => {
    expect(
      buildCommitteeMeetingTitle({ ...meeting, meeting_date: "不明" })
    ).toContain("（不明）");
  });
});

describe("buildCommitteeMeetingDescription", () => {
  it("要約が 120 字ちょうどなら、そのまま使う", () => {
    expect(countCharacters(meeting.summary)).toBe(120);
    expect(buildCommitteeMeetingDescription(meeting)).toBe(meeting.summary);
  });

  it("要約が 120 字を超えるときは、文の切れ目（先頭の 3 文）までにする", () => {
    const fourthSentence =
      "認定第2号から第6号までの5件の決算は、異議なく認定されました。";
    const description = buildCommitteeMeetingDescription({
      ...meeting,
      summary: `${meeting.summary}${fourthSentence}`,
    });
    expect(description).toBe(meeting.summary);
    expect(description.endsWith("。")).toBe(true);
  });

  it("要約が短ければそのまま使う", () => {
    expect(
      buildCommitteeMeetingDescription({
        ...meeting,
        summary: "短い要約です。",
      })
    ).toBe("短い要約です。");
  });

  it("要約が無い記録は、会議名と開催日の定型文にする", () => {
    const description = buildCommitteeMeetingDescription({
      ...meeting,
      summary: null,
    });
    expect(description).toContain("本会議（令和8年10月8日開催）の記録");
    expect(countCharacters(description)).toBeLessThanOrEqual(120);
  });

  it("要約が空文字の記録も、定型文にする（空の description を出さない）", () => {
    const description = buildCommitteeMeetingDescription({
      ...meeting,
      summary: "",
    });
    expect(description).toContain("本会議（令和8年10月8日開催）の記録");
  });

  it("会議名が長くても 120 字を超えない", () => {
    const description = buildCommitteeMeetingDescription({
      committee_name:
        "陸田孝則議員の公職選挙法及び田川市政治倫理条例違反疑惑に関する検証等特別委員会",
      meeting_date: "2026-09-02",
      summary: null,
    });
    expect(countCharacters(description)).toBeLessThanOrEqual(120);
  });
});

describe("buildCommitteeMeetingJsonLd", () => {
  const url = "https://tagawa-gikai.jp/committees/abc";
  const imageUrl = "https://tagawa-gikai.jp/ogp.jpg";
  const data = buildCommitteeMeetingJsonLd({ meeting, url, imageUrl });

  it("Article として、見出し・説明・画像・URL を入れる", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Article");
    expect(data.headline).toBe(meeting.headline);
    expect(data.description).toBe(buildCommitteeMeetingDescription(meeting));
    expect(data.image).toBe(imageUrl);
    expect(data.mainEntityOfPage).toBe(url);
    expect(data.inLanguage).toBe("ja");
  });

  it("datePublished は会議の開催日、dateModified は記録の更新日時", () => {
    expect(data.datePublished).toBe("2026-10-08");
    expect(data.dateModified).toBe("2026-10-11T04:54:28.362Z");
  });

  it("author は運営者、publisher はサイト名", () => {
    expect(data.author).toEqual({
      "@type": "Organization",
      name: "田川市政ラボ",
    });
    expect(data.publisher).toEqual({
      "@type": "Organization",
      name: "みらい議会＠田川市",
    });
  });

  it("見出しが無い記録の headline は会議名と日付", () => {
    const noHeadline = buildCommitteeMeetingJsonLd({
      meeting: { ...meeting, headline: null },
      url,
      imageUrl,
    });
    expect(noHeadline.headline).toBe("田川市議会 本会議（令和8年10月8日）");
  });

  it("見出しが空文字の記録の headline も、会議名と日付（空の headline を出さない）", () => {
    const emptyHeadline = buildCommitteeMeetingJsonLd({
      meeting: { ...meeting, headline: "" },
      url,
      imageUrl,
    });
    expect(emptyHeadline.headline).toBe("田川市議会 本会議（令和8年10月8日）");
  });

  it("記録に無い項目（執筆者の個人名・ロゴ・評価など）は入れない", () => {
    for (const key of ["review", "aggregateRating", "logo", "keywords"]) {
      expect(key in data).toBe(false);
    }
  });

  it("JSON に書き出して読み戻しても、同じ内容になる", () => {
    // undefined の項目があると、書き出したときに黙って消えるので strict で比べる
    const roundTripped = JSON.parse(JSON.stringify(data));
    expect(roundTripped).toStrictEqual(data);
    expect(roundTripped["@type"]).toBe("Article");
    expect(roundTripped.headline).toBe(meeting.headline);
    expect(roundTripped.datePublished).toBe("2026-10-08");
  });
});

describe("buildCommitteeGroupTitle", () => {
  it("「田川市議会 ○○の記録（N回）」の形で、短い呼び名を使う", () => {
    expect(
      buildCommitteeGroupTitle({
        committeeName: "総務文教委員会",
        meetingCount: 34,
      })
    ).toBe("田川市議会 総務文教委員会の記録（34回）");
    expect(
      buildCommitteeGroupTitle({
        committeeName: "指名競争入札による建設工事発注に関する調査特別委員会",
        meetingCount: 7,
      })
    ).toBe("田川市議会 入札調査特別委員会（百条委員会）の記録（7回）");
  });

  it("未登録の委員会は委員会名をそのまま使う", () => {
    expect(
      buildCommitteeGroupTitle({
        committeeName: "架空の特別委員会",
        meetingCount: 1,
      })
    ).toBe("田川市議会 架空の特別委員会の記録（1回）");
  });

  it("題名は 40 字以内（サイト名が後ろに付いても、検索結果で内容が分かるように）", () => {
    for (const committeeName of Object.keys(COMMITTEE_PROFILES)) {
      const title = buildCommitteeGroupTitle({
        committeeName,
        meetingCount: 120,
      });
      expect(countCharacters(title), title).toBeLessThanOrEqual(40);
    }
  });

  it("委員会ごとに題名がちがう（検索結果で同じ表示が並ばない）", () => {
    const titles = Object.keys(COMMITTEE_PROFILES).map((committeeName) =>
      buildCommitteeGroupTitle({ committeeName, meetingCount: 10 })
    );
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("buildCommitteeGroupDescription", () => {
  const committeeNames = [
    ...Object.keys(COMMITTEE_PROFILES),
    "架空の特別委員会",
  ];
  const periods = [
    { label: "2026年", period: { from: "2026-01-05", to: "2026-10-08" } },
    { label: "2021〜2026年", period: { from: "2021-01-21", to: "2026-10-08" } },
  ];

  it("全プロフィール × 回数 × 期間で、80〜120 字で「。」で終わり、「…」で切れない", () => {
    for (const committeeName of committeeNames) {
      for (const meetingCount of [1, 9, 45, 120]) {
        for (const { period } of periods) {
          const description = buildCommitteeGroupDescription({
            committeeName,
            meetingCount,
            period,
          });
          const length = countCharacters(description);
          const where = `${committeeName} ${meetingCount}回 ${period.from}〜${period.to}: ${description}`;
          expect(length, where).toBeGreaterThanOrEqual(DESCRIPTION_MIN_LENGTH);
          expect(length, where).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH);
          expect(description.endsWith("。"), where).toBe(true);
          expect(description.includes("…"), where).toBe(false);
        }
      }
    }
  });

  it("期間・回数・「見出しと要点つきで掲載」がどの委員会でも残る", () => {
    for (const committeeName of committeeNames) {
      for (const { label, period } of periods) {
        const description = buildCommitteeGroupDescription({
          committeeName,
          meetingCount: 45,
          period,
        });
        expect(description).toContain(`${label}の45回分の記録`);
        expect(description).toContain("見出しと要点つきで掲載しています。");
      }
    }
  });

  it("委員会の説明が文の切れ目で入る（説明が長い委員会は、入る文までにする）", () => {
    const period = { from: "2021-01-21", to: "2026-10-08" };
    const kosei = buildCommitteeGroupDescription({
      committeeName: "厚生委員会",
      meetingCount: 21,
      period,
    });
    expect(kosei).toContain(COMMITTEE_PROFILES.厚生委員会.description);

    // 2 文目まで入れると 120 字を超えるので、1 文目までになる
    const jorei = buildCommitteeGroupDescription({
      committeeName: "政治倫理条例検討特別委員会",
      meetingCount: 2,
      period,
    });
    expect(jorei).toContain(
      "時代に合わせて見直すために令和8年9月に設置された特別委員会です。"
    );
    expect(jorei).not.toContain("議員18名全員が委員を務めます");
  });

  it("説明が短い委員会には、補足の一文を足して 80 字以上にする", () => {
    const description = buildCommitteeGroupDescription({
      committeeName: "議会報告会",
      meetingCount: 1,
      period: { from: "2026-01-05", to: "2026-01-05" },
    });
    expect(description).toContain("各回のページで");
    expect(countCharacters(description)).toBeGreaterThanOrEqual(
      DESCRIPTION_MIN_LENGTH
    );
  });
});

describe("buildCommitteeGroupJsonLd", () => {
  const baseUrl = "https://tagawa-gikai.jp";

  function listItem(
    overrides: Partial<CommitteeMeetingListItem>
  ): CommitteeMeetingListItem {
    return {
      id: "id-1",
      committee_name: "総務文教委員会",
      meeting_date: "2026-09-14",
      headline: "令和8年度補正予算を審査",
      topics: [],
      source_type: "youtube",
      ...overrides,
    };
  }

  const meetings = [
    listItem({ id: "old", meeting_date: "2025-06-10", headline: "古い会議" }),
    listItem({ id: "new", meeting_date: "2026-09-14", headline: "新しい会議" }),
    listItem({ id: "none", meeting_date: "2026-02-01", headline: null }),
    listItem({ id: "empty", meeting_date: "2025-12-01", headline: "" }),
  ];
  const data = buildCommitteeGroupJsonLd({
    committeeName: "総務文教委員会",
    meetings,
    baseUrl,
  });
  const items = data.itemListElement as Array<Record<string, unknown>>;

  it("ItemList として、名前・一覧ページの URL・件数を入れる", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("ItemList");
    expect(data.name).toBe("田川市議会 総務文教委員会の記録");
    expect(data.url).toBe(`${baseUrl}/committees/group/somu-bunkyo`);
    expect(data.numberOfItems).toBe(4);
    expect(items).toHaveLength(4);
  });

  it("会議を新しい順に並べ、position は 1 から振る", () => {
    expect(items.map((item) => item.position)).toEqual([1, 2, 3, 4]);
    expect(items.map((item) => item.url)).toEqual([
      `${baseUrl}/committees/new`,
      `${baseUrl}/committees/none`,
      `${baseUrl}/committees/empty`,
      `${baseUrl}/committees/old`,
    ]);
  });

  it("項目名は会議の見出し。無ければ（空文字も）会議名と日付", () => {
    expect(items.map((item) => item.name)).toEqual([
      "新しい会議",
      "田川市議会 総務文教委員会（令和8年2月1日）",
      "田川市議会 総務文教委員会（令和7年12月1日）",
      "古い会議",
    ]);
  });

  it("各項目は ListItem で、url は絶対 URL", () => {
    for (const item of items) {
      expect(item["@type"]).toBe("ListItem");
      expect(String(item.url)).toMatch(
        /^https:\/\/tagawa-gikai\.jp\/committees\//
      );
    }
  });

  it("未登録の委員会の一覧ページの URL は委員会名をエンコードする", () => {
    const unregistered = buildCommitteeGroupJsonLd({
      committeeName: "架空の特別委員会",
      meetings: [listItem({ committee_name: "架空の特別委員会" })],
      baseUrl,
    });
    expect(unregistered.url).toBe(
      `${baseUrl}/committees/group/${encodeURIComponent("架空の特別委員会")}`
    );
  });

  it("会議が無ければ項目は空", () => {
    const empty = buildCommitteeGroupJsonLd({
      committeeName: "総務文教委員会",
      meetings: [],
      baseUrl,
    });
    expect(empty.numberOfItems).toBe(0);
    expect(empty.itemListElement).toEqual([]);
  });

  it("決めた項目だけを出す（評価・執筆者の個人名などを足さない）", () => {
    expect(Object.keys(data).sort()).toEqual(
      [
        "@context",
        "@type",
        "itemListElement",
        "name",
        "numberOfItems",
        "url",
      ].sort()
    );
    const items = data.itemListElement as Record<string, unknown>[];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(
        ["@type", "name", "position", "url"].sort()
      );
    }
  });

  it("JSON に書き出して読み戻しても、同じ内容になる", () => {
    // undefined の項目があると、書き出したときに黙って消えるので strict で比べる
    expect(JSON.parse(JSON.stringify(data))).toStrictEqual(data);
  });
});
