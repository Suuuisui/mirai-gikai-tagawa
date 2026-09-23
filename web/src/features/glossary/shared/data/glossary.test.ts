import { describe, expect, it } from "vitest";
import { GLOSSARY, glossaryWords, pickGlossaryTerms } from "./glossary";

describe("pickGlossaryTerms", () => {
  it("本文に登場することばだけを返す", () => {
    const terms = pickGlossaryTerms([
      "百条委員会で入札の経緯を調査しました。",
      "補正予算を可決しました。",
    ]);
    expect(terms.map((t) => t.term)).toEqual(["補正予算", "百条委員会"]);
  });

  it("別表記（aliases）でも検出する", () => {
    const terms = pickGlossaryTerms([
      "地方自治法100条に基づき記録の提出を請求しました。普通交付税は減額です。",
    ]);
    expect(terms.map((t) => t.term)).toEqual(["地方交付税", "百条委員会"]);
  });

  it("定義順（重要度順）を保つ", () => {
    const terms = pickGlossaryTerms(["専決処分と百条委員会について"]);
    expect(terms.map((t) => t.term)).toEqual(["専決処分", "百条委員会"]);
  });

  it("該当することばがなければ空配列を返す", () => {
    expect(pickGlossaryTerms(["特に専門用語のない文章です"])).toEqual([]);
  });

  it("空入力でも落ちない", () => {
    expect(pickGlossaryTerms([])).toEqual([]);
  });
});

describe("GLOSSARY", () => {
  it("見出し語が重複していない", () => {
    const terms = GLOSSARY.map((t) => t.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("検出に使う語（見出し語と別表記）が項目をまたいで重複していない", () => {
    const words = GLOSSARY.flatMap(glossaryWords);
    const duplicates = words.filter(
      (word, index) => words.indexOf(word) !== index
    );
    expect(duplicates).toEqual([]);
  });

  it("検出に使う語は空でない", () => {
    for (const word of GLOSSARY.flatMap(glossaryWords)) {
      expect(word.trim().length).toBeGreaterThan(0);
    }
  });

  it("説明は1文以上あり、末尾が句点で終わる", () => {
    for (const entry of GLOSSARY) {
      expect(entry.description.length).toBeGreaterThan(20);
      expect(entry.description.endsWith("。")).toBe(true);
    }
  });
});
