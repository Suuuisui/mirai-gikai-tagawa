import { describe, expect, it } from "vitest";
import {
  type BillDescriptionSource,
  type BillResultSource,
  buildBillSourceSection,
  parseBillSources,
} from "./bill-source-section";

const base = {
  sessionName: "令和8年（第6回）9月定例会",
  sourceUrl: "https://example.com/r8-6",
  isOngoing: false,
  descriptionSource: null,
  resultSource: undefined,
} as const;

describe("buildBillSourceSection", () => {
  it("解説が無い議案は公式ページのリンクと転記のみの注記だけ", () => {
    expect(buildBillSourceSection(base)).toEqual([
      "## 出典",
      "",
      "- [田川市議会「令和8年（第6回）9月定例会の提出議案と議決結果」](https://example.com/r8-6)（福岡県田川市公式サイト）",
      "",
      "※ この内容は田川市議会事務局が公開する情報を基に事実のみを転記したものです。分かりやすい解説文のAIによる生成は行っていません。",
    ]);
  });

  it("会期中の会期は公式ページの題名を「提出議案」にする", () => {
    expect(buildBillSourceSection({ ...base, isOngoing: true })[2]).toContain(
      "9月定例会の提出議案」"
    );
  });

  it("会議録ベースの解説と会議録由来の結果は、それぞれの箇条書きを添える", () => {
    const lines = buildBillSourceSection({
      ...base,
      descriptionSource: "minutes",
      resultSource: "minutes",
    });

    expect(lines[3]).toMatch(/^- \[田川市議会 会議録検索システム\]/);
    expect(lines[4]).toMatch(/^- 議決結果は\[田川市議会 会議録検索システム\]/);
    expect(lines.at(-1)).toMatch(
      /^※ 上記の解説は、田川市議会 会議録検索システム/
    );
  });

  it("中継ベースの解説は説明資料と中継の両方を出典に挙げる", () => {
    const lines = buildBillSourceSection({
      ...base,
      descriptionSource: "broadcast",
      resultSource: "broadcast",
    });

    expect(lines[3]).toContain("議案説明資料（PDF）");
    expect(lines[4]).toContain("公式YouTubeチャンネル");
    expect(lines[5]).toContain("中継映像で確認したものです");
    expect(lines.at(-1)).toContain("中継映像（自動字幕）をもとに");
  });

  it("公式の議決結果ページが出典の結果には、結果の箇条書きを足さない", () => {
    expect(
      buildBillSourceSection({ ...base, resultSource: "official" })
    ).toEqual(buildBillSourceSection(base));
  });
});

describe("parseBillSources", () => {
  const descriptionSources: (BillDescriptionSource | null)[] = [
    null,
    "minutes",
    "explanation-materials",
    "broadcast",
  ];
  const resultSources: BillResultSource[] = ["official", "minutes", "broadcast"];

  it.each(
    descriptionSources.flatMap((descriptionSource) =>
      resultSources.flatMap((resultSource) =>
        [false, true].map((isOngoing) => ({
          descriptionSource,
          resultSource,
          isOngoing,
        }))
      )
    )
  )(
    "書き出した出典をそのまま読み戻せる（解説 $descriptionSource・結果 $resultSource・会期中 $isOngoing）",
    ({ descriptionSource, resultSource, isOngoing }) => {
      const content = [
        "## 解説",
        "",
        "本文。途中に「## 出典」という文字が出てきても最後の見出しだけを見る。",
        "",
        ...buildBillSourceSection({
          ...base,
          isOngoing,
          descriptionSource,
          resultSource,
        }),
      ].join("\n");

      expect(parseBillSources(content)).toEqual({
        officialPage: { url: "https://example.com/r8-6", isOngoing },
        descriptionSource,
        resultSource,
      });
    }
  );

  it("「## 出典」が無い本文は null", () => {
    expect(parseBillSources("## 解説\n\n管理画面で書いた本文")).toBeNull();
    expect(parseBillSources(null)).toBeNull();
    expect(parseBillSources("")).toBeNull();
  });

  it("出典の見出しはあるが公式ページの行が無い本文は、ページだけ null にする", () => {
    expect(parseBillSources("## 出典\n\n- 手で書いた出典")).toEqual({
      officialPage: null,
      descriptionSource: null,
      resultSource: "official",
    });
  });
});
