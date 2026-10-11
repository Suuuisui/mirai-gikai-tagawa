import { describe, expect, it } from "vitest";
import { countCharacters } from "@/lib/seo/page-description";
import {
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
