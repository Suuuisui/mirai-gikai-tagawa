import { describe, expect, it } from "vitest";
import { parseQuestionOutlines, splitColumns } from "./question-outline-parser";

const SAMPLE = `*******************************************************
*                田    川    市    議    会                *
*             令和８年（第６回）９月定例会一般質問                      *
*******************************************************

質問議員

 1.   山野   義人   議員    6.   石松   和幸   議員   11.   村    勇介   議員

 5.   小林   義憲   議員   10.   永松   広宣   議員
                                               令和８年（第６回）９月定例会一般質問
                                                                         令和８年９月９日・１０日・１１日

１．山      野    義       人       議員（公明党）                                               【一問一答】
 質        問       事       項                         要              旨                備    考
 １       ＲＳウイルス感染             ⑴       ＲＳウイルス感染症の特徴及び重症化のリスクについて
     症の予防対策につい                    ア    ＲＳウイルス感染症の基本的特徴について問う。
     て                            イ    乳幼児における発症頻度と重症化・入院リスクについて問う。


                              ⑵       基礎疾患を有する高齢者の重症化について
                                  ア    基礎疾患を有する高齢者への健康被害及びＡＤＬ（日常生活動作）低下・要介護化への影響に
                                      ついて問う。

                                                        1
                                        令和８年（第６回）９月定例会一般質問
                                                                         令和８年９月９日・１０日・１１日

２．    原       大       祐       議員（シン・タガワ）                                 【一問一答】
 質        問       事       項                   要              旨            備    考
 １    ふるさと納税につ                ⑴   本市のふるさと納税の現状について問う。
     いて
                              ⑵   寄附額・寄附件数の推移について問う。


 ２    市長の掲げる４つ                ⑴   改革の実現に向けた基本方針について問う。
     の改革について
`;

describe("parseQuestionOutlines", () => {
  it("議員ごとに質問事項と要旨（⑴とその下のア・イ）を読み取る", () => {
    const outlines = parseQuestionOutlines(SAMPLE);
    expect(outlines.map((o) => [o.order, o.format, o.items.length])).toEqual([
      [1, "一問一答", 1],
      [2, "一問一答", 2],
    ]);
    expect(outlines[0].items[0]).toEqual({
      title: "RSウイルス感染症の予防対策について",
      points: [
        {
          text: "RSウイルス感染症の特徴及び重症化のリスクについて",
          subPoints: [
            "RSウイルス感染症の基本的特徴について問う。",
            "乳幼児における発症頻度と重症化・入院リスクについて問う。",
          ],
        },
        {
          text: "基礎疾患を有する高齢者の重症化について",
          subPoints: [
            "基礎疾患を有する高齢者への健康被害及びADL（日常生活動作）低下・要介護化への影響について問う。",
          ],
        },
      ],
    });
  });

  it("質問事項の折り返しを連結し、ページ番号や表題の行は無視する", () => {
    const outlines = parseQuestionOutlines(SAMPLE);
    expect(outlines[1].items.map((item) => item.title)).toEqual([
      "ふるさと納税について",
      "市長の掲げる4つの改革について",
    ]);
    expect(outlines[1].items[0].points.map((p) => p.text)).toEqual([
      "本市のふるさと納税の現状について問う。",
      "寄附額・寄附件数の推移について問う。",
    ]);
  });

  it("表紙の質問者一覧（1行に複数の議員）は議員の区切りとみなさない", () => {
    expect(parseQuestionOutlines(SAMPLE).map((o) => o.order)).toEqual([1, 2]);
  });
});

describe("parseQuestionOutlines の文字の整え方", () => {
  it("折り返しでできた日本語の文字間の空白を取り除き、英数字は半角にする", () => {
    const text = `１．村 吉 勇 介 議員 【一問一答】
 質     問       事   項         要              旨      備   考
 １    市民プールについて          ⑴    市民プール で開催して いるバリア フリーデイ への本市の関わりについて問う。
                              ⑵    ＤＸ推進計画 ver.2 について問う。
`;
    const [outline] = parseQuestionOutlines(text);
    expect(outline.items[0].points.map((p) => p.text)).toEqual([
      "市民プールで開催しているバリアフリーデイへの本市の関わりについて問う。",
      "DX推進計画 ver.2 について問う。",
    ]);
  });
});

describe("parseQuestionOutlines の形式の読み取り", () => {
  const withHeader = (header: string) => `${header}
 質     問       事   項         要              旨      備   考
 １    市政運営について          ⑴    行政の継続性について見解を問う。
`;

  it("【】が無ければ形式は null、総括質問は一括質問として扱う", () => {
    expect(parseQuestionOutlines(withHeader("１．今 村 寿 人 議員（孔志会）"))[0].format).toBeNull();
    expect(
      parseQuestionOutlines(withHeader("１．今 村 寿 人 議員（孔志会） 【総括質問】"))[0].format
    ).toBe("一括質問");
  });

  it("議員の見出しが無いテキストは空配列", () => {
    expect(parseQuestionOutlines("質問議員\n 1. 山野 義人 議員")).toEqual([]);
  });
});

describe("splitColumns", () => {
  it("行頭が深い行は右列、大きな空白があれば左右に分ける", () => {
    expect(splitColumns("                              ⑵   基礎疾患")).toEqual({
      left: "",
      right: "⑵   基礎疾患",
    });
    expect(splitColumns(" １       ＲＳウイルス感染             ⑴       特徴")).toEqual({
      left: "１       ＲＳウイルス感染",
      right: "⑴       特徴",
    });
    expect(splitColumns("     症の予防対策につい")).toEqual({
      left: "症の予防対策につい",
      right: "",
    });
  });
});
