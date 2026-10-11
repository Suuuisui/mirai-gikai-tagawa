import {
  type BillDescriptionSource,
  type BillResultSource,
  buildBillSourceSection,
} from "@mirai-gikai/shared/council/bill-source-section";
import { describe, expect, it } from "vitest";
import { buildBillSourceRefs } from "./bill-sources";

function contentWith(
  descriptionSource: BillDescriptionSource | null,
  resultSource: BillResultSource,
  isOngoing = false
): string {
  return [
    "## 解説",
    "",
    "本文",
    "",
    ...buildBillSourceSection({
      sessionName: "令和8年（第6回）9月定例会",
      sourceUrl: "https://example.com/r8-6",
      isOngoing,
      descriptionSource,
      resultSource,
    }),
  ].join("\n");
}

describe("buildBillSourceRefs", () => {
  it("出典の見出しが無い本文は何も出さない", () => {
    expect(buildBillSourceRefs("## 解説\n\n本文")).toEqual([]);
    expect(buildBillSourceRefs(null)).toEqual([]);
  });

  it("解説が無い議案は、公式の議決結果のページだけ", () => {
    expect(buildBillSourceRefs(contentWith(null, "official"))).toEqual([
      {
        kind: "official",
        detail: "議決結果のページ",
        scope: "議案番号・件名・提出者・議決結果",
        href: "https://example.com/r8-6",
      },
    ]);
  });

  it("会議録がもとの解説は、事実と解説を分けて公式の区分で示す", () => {
    const refs = buildBillSourceRefs(contentWith("minutes", "official"));

    expect(refs.map((ref) => [ref.kind, ref.detail])).toEqual([
      ["official", "議決結果のページ"],
      ["official", "会議録"],
    ]);
    expect(refs[1].scope).toContain("解説");
    expect(refs[1].href).toBe("https://www.kensakusystem.jp/tagawa/index.html");
  });

  it("中継がもとの解説と結果は、文字起こしの区分で示す", () => {
    const refs = buildBillSourceRefs(contentWith("broadcast", "broadcast"));

    expect(refs.map((ref) => [ref.kind, ref.detail])).toEqual([
      ["official", "議決結果のページ"],
      ["transcript", "本会議の中継"],
      ["official", "議案説明資料"],
      ["transcript", "本会議の中継"],
    ]);
    // 結果が中継で確認したものなら、公式ページの行は結果を含めない
    expect(refs[0].scope).toBe("議案番号・件名・提出者");
    expect(refs[1].scope).toContain("議決結果");
  });

  it("会期中の議案は、公式ページを「提出議案のページ」として示し結果を含めない", () => {
    const refs = buildBillSourceRefs(
      contentWith("broadcast", "official", true)
    );

    expect(refs[0]).toEqual({
      kind: "official",
      detail: "提出議案のページ",
      scope: "議案番号・件名・提出者",
      href: "https://example.com/r8-6",
    });
  });

  it("説明資料だけがもとの解説は、質疑・討論を含まないことを添える", () => {
    const refs = buildBillSourceRefs(
      contentWith("explanation-materials", "official")
    );

    expect(refs[1]).toEqual({
      kind: "official",
      detail: "議案説明資料",
      scope: "解説（本会議の質疑・討論は含みません）",
    });
  });

  it("会議録から拾った結果は、会議録の行を足す", () => {
    const refs = buildBillSourceRefs(contentWith("minutes", "minutes"));

    expect(refs.map((ref) => ref.scope)).toEqual([
      "議案番号・件名・提出者",
      "議決結果",
      "解説（提案理由・質疑・討論・採決）",
    ]);
  });

  it("同じ区分・同じ資料の行でも、対象が違えば別の行になる（Reactのkeyが重ならない）", () => {
    const refs = buildBillSourceRefs(contentWith("minutes", "minutes"));
    const keys = refs.map((ref) => `${ref.kind}-${ref.detail}-${ref.scope}`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
