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

  // 本番DBに入っている本文の実物（2026-10-11 時点）。定数から組み立てた往復テストだけだと、
  // 文言を変えたときに「古い本文が読めなくなる」ことに気づけないので、文字列を固定しておく
  it("本番に入っている中継ベースの本文（会期中の「提出議案」ページ）を読める", () => {
    const content =
      "## 解説\n\n本文\n\n## 出典\n\n- [田川市議会「令和8年（第6回）9月定例会の提出議案」](https://www.joho.tagawa.fukuoka.jp/kiji00311959/index.html)（福岡県田川市公式サイト）\n- 田川市議会公式サイトに掲載の議案説明資料（PDF）等の公開情報\n- [田川市議会 公式YouTubeチャンネル](https://www.joho.tagawa.fukuoka.jp/kiji0037830/index.html)の本会議中継映像（提案理由説明・質疑・討論・採決）\n\n※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等と、公式YouTubeチャンネルの本会議中継映像（自動字幕）をもとに作成しています。本会議録は本稿執筆時点（2026年9月）で田川市議会 会議録検索システムに未公開のため、発言の細部は中継映像でご確認ください。";

    expect(parseBillSources(content)).toEqual({
      officialPage: {
        url: "https://www.joho.tagawa.fukuoka.jp/kiji00311959/index.html",
        isOngoing: true,
      },
      descriptionSource: "broadcast",
      resultSource: "official",
    });
  });

  it("本番に入っている会議録ベースの本文（結果も会議録から抽出）を読める", () => {
    const content =
      "## 解説\n\n本文\n\n## 出典\n\n- [田川市議会「令和元年（第5回）12月定例会の提出議案と議決結果」](https://www.joho.tagawa.fukuoka.jp/kiji0036592/index.html)（福岡県田川市公式サイト）\n- [田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録（提案理由説明・委員会審査結果報告・質疑・討論等）\n- 議決結果は[田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録から自動抽出したものです\n\n※ 上記の解説は、田川市議会 会議録検索システムで公開されている本会議録（提案理由説明・委員会審査結果報告・質疑・討論の内容）をもとに作成しています。";

    expect(parseBillSources(content)).toEqual({
      officialPage: {
        url: "https://www.joho.tagawa.fukuoka.jp/kiji0036592/index.html",
        isOngoing: false,
      },
      descriptionSource: "minutes",
      resultSource: "minutes",
    });
  });

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
