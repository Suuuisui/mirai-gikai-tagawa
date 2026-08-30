import { describe, expect, it } from "vitest";
import { COMMITTEE_GLOSSARY, pickGlossaryTerms } from "./committee-glossary";

describe("pickGlossaryTerms", () => {
  it("本文に登場する用語だけを返す", () => {
    const terms = pickGlossaryTerms([
      "百条委員会で入札の経緯を調査しました。",
      "補正予算を可決しました。",
    ]);
    expect(terms.map((t) => t.term)).toEqual(["百条委員会", "補正予算"]);
  });

  it("別表記（aliases）でも検出する", () => {
    const terms = pickGlossaryTerms([
      "地方自治法100条に基づき記録の提出を請求しました。",
    ]);
    expect(terms.map((t) => t.term)).toContain("百条委員会");
  });

  it("定義順（重要度順）を保つ", () => {
    const terms = pickGlossaryTerms(["専決処分と百条委員会について"]);
    expect(terms.map((t) => t.term)).toEqual(["百条委員会", "専決処分"]);
  });

  it("該当する用語がなければ空配列を返す", () => {
    expect(pickGlossaryTerms(["特に専門用語のない文章です"])).toEqual([]);
  });

  it("空入力でも落ちない", () => {
    expect(pickGlossaryTerms([])).toEqual([]);
  });
});

describe("COMMITTEE_GLOSSARY", () => {
  it("見出し語が重複していない", () => {
    const terms = COMMITTEE_GLOSSARY.map((t) => t.term);
    expect(new Set(terms).size).toBe(terms.length);
  });
});
