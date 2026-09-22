import { describe, expect, it } from "vitest";
import {
  matchQuestionVideos,
  parseQuestionVideoTitle,
} from "./question-video-matcher";

describe("parseQuestionVideoTitle", () => {
  it("2026年チャンネルの並び（日付・議員・一般質問）を読み取る", () => {
    expect(
      parseQuestionVideoTitle("【令和8年9月11日】梶原みつ子議員　一般質問（田川市議会9月定例会）")
    ).toEqual({ date: "2026-09-11", name: "梶原みつ子" });
  });

  it("旧チャンネルの並び（日付・一般質問・議員〔会派〕）も読み取る", () => {
    expect(
      parseQuestionVideoTitle("【令和7年3月4日】一般質問 　今村寿人議員〔孔志会〕（田川市議会3月定例会）")
    ).toEqual({ date: "2025-03-04", name: "今村寿人" });
  });

  it("異体字の議員名は照合用に寄せる", () => {
    expect(
      parseQuestionVideoTitle("【令和8年9月9日】榊󠄀原大祐議員　一般質問（田川市議会9月定例会）")?.name
    ).toBe("榊原大祐");
  });

  it("一般質問以外の動画は null", () => {
    expect(
      parseQuestionVideoTitle("【令和8年6月24日】 陸田孝則議員の検証等特別委員会")
    ).toBeNull();
  });
});

describe("matchQuestionVideos", () => {
  const videos = [
    { id: "36I14fV3dBE", title: "【令和8年9月9日】山野義人議員　一般質問（田川市議会9月定例会）" },
    { id: "G7SE2Ke_aN4", title: "【令和8年9月11日】村𠮷勇介議員　一般質問（田川市議会9月定例会）" },
  ];

  it("同じ姓の別人には結び付けず、同じ動画が2件あれば後のものを使う", () => {
    const matched = matchQuestionVideos(
      [
        { id: "a", questionDate: "2025-12-03", memberName: "髙瀬 冨士夫" },
        { id: "b", questionDate: "2025-12-03", memberName: "髙瀬 春美" },
      ],
      [
        { id: "v1", title: "【令和7年12月3日】一般質問 　髙瀬冨士夫議員（田川市議会12月定例会）" },
        { id: "v2", title: "【令和7年12月3日】一般質問 　髙瀬冨士夫議員（田川市議会12月定例会）" },
      ]
    );
    expect(Object.fromEntries(matched)).toEqual({
      a: "https://www.youtube.com/watch?v=v2",
    });
  });

  it("同じ日・同じ議員の動画だけを結び付ける", () => {
    const matched = matchQuestionVideos(
      [
        { id: "r8-6-teirei-1", questionDate: "2026-09-09", memberName: "山野 義人" },
        { id: "r8-6-teirei-11", questionDate: "2026-09-11", memberName: "村吉 勇介" },
        { id: "r8-6-teirei-2", questionDate: "2026-09-09", memberName: "榊原 大祐" },
        { id: "r8-4-teirei-1", questionDate: null, memberName: "山野 義人" },
      ],
      videos
    );
    expect(Object.fromEntries(matched)).toEqual({
      "r8-6-teirei-1": "https://www.youtube.com/watch?v=36I14fV3dBE",
      "r8-6-teirei-11": "https://www.youtube.com/watch?v=G7SE2Ke_aN4",
    });
  });
});
