import { describe, expect, it } from "vitest";
import {
  COMMITTEE_SOURCES,
  countMeetingsBySourceKind,
  parseSourceNote,
  toCommitteeSourceType,
} from "./committee-source";

describe("toCommitteeSourceType", () => {
  it("DBの値をそのまま通す", () => {
    expect(toCommitteeSourceType("minutes")).toBe("minutes");
    expect(toCommitteeSourceType("disclosure")).toBe("disclosure");
    expect(toCommitteeSourceType("youtube")).toBe("youtube");
  });

  it("知らない値は中継の文字起こしとして扱う", () => {
    expect(toCommitteeSourceType("")).toBe("youtube");
    expect(toCommitteeSourceType("unknown")).toBe("youtube");
  });
});

describe("COMMITTEE_SOURCES", () => {
  it("記録のもとを、サイト共通の3区分に対応させる", () => {
    expect(COMMITTEE_SOURCES.minutes.kind).toBe("official");
    expect(COMMITTEE_SOURCES.youtube.kind).toBe("transcript");
    expect(COMMITTEE_SOURCES.disclosure.kind).toBe("disclosure");
  });
});

describe("countMeetingsBySourceKind", () => {
  it("区分ごとの会議数を数える", () => {
    expect(
      countMeetingsBySourceKind([
        { source_type: "youtube" },
        { source_type: "youtube" },
        { source_type: "minutes" },
        { source_type: "disclosure" },
      ])
    ).toEqual({ official: 1, transcript: 2, disclosure: 1 });
  });

  it("記録が無ければすべて0", () => {
    expect(countMeetingsBySourceKind([])).toEqual({
      official: 0,
      transcript: 0,
      disclosure: 0,
    });
  });
});

describe("parseSourceNote", () => {
  it("補足が無ければ文章も動画も無し", () => {
    const empty = { text: null, videos: [], usesSpeechRecognition: false };
    expect(parseSourceNote(null)).toEqual(empty);
    expect(parseSourceNote("  ")).toEqual(empty);
  });

  it("どの資料をもとにしたかの決まり文句だけの補足は、文章を出さない", () => {
    expect(
      parseSourceNote(
        "田川市議会公式YouTubeチャンネルの中継映像の自動字幕をテキスト化したものです。"
      ).text
    ).toBeNull();
    expect(
      parseSourceNote(
        "田川市への情報開示請求により入手した文書をもとにしています。\n同日の会議は田川市議会公式YouTubeチャンネルの中継映像でも公開されています: https://www.youtube.com/watch?v=ccc"
      )
    ).toEqual({ text: null, videos: [], usesSpeechRecognition: false });
  });

  it("決まり文句の後ろに足された補足の文は残す", () => {
    expect(
      parseSourceNote(
        "田川市議会公式YouTubeチャンネルの中継映像の音声を文字起こし（自動字幕が無いため音声認識 Whisper を使用。誤変換を含む）したものです。冒頭の10分は音声がありません。"
      )
    ).toEqual({
      text: "冒頭の10分は音声がありません。",
      videos: [],
      usesSpeechRecognition: true,
    });
    expect(
      parseSourceNote(
        "田川市への情報開示請求により入手した文書をもとにしています。原本の3ページ目は判読できません。"
      ).text
    ).toBe("原本の3ページ目は判読できません。");
  });

  it("決まり文句でない補足は、改行を詰めてそのまま出す", () => {
    expect(parseSourceNote("原本の3ページ目は\n判読できません。").text).toBe(
      "原本の3ページ目は 判読できません。"
    );
  });

  it("議員ごとの動画を文章から分ける", () => {
    expect(
      parseSourceNote(
        "田川市議会公式YouTubeチャンネルの中継映像（議員ごとに1本）の自動字幕をテキスト化したものです。動画: 佐藤俊一議員（日本共産党市会議員団） https://www.youtube.com/watch?v=aaa / 柿田孝子議員 https://www.youtube.com/watch?v=bbb"
      )
    ).toEqual({
      text: null,
      videos: [
        {
          label: "佐藤俊一議員（日本共産党市会議員団）",
          url: "https://www.youtube.com/watch?v=aaa",
        },
        { label: "柿田孝子議員", url: "https://www.youtube.com/watch?v=bbb" },
      ],
      usesSpeechRecognition: false,
    });
  });

  it("同じ日に何本かに分かれた会議の動画も読み取る", () => {
    expect(
      parseSourceNote(
        "動画: 議会運営委員会①（本会議開会前） https://example.com/1 / 議会運営委員会②（本会議休憩中） https://example.com/2"
      ).videos
    ).toEqual([
      {
        label: "議会運営委員会①（本会議開会前）",
        url: "https://example.com/1",
      },
      {
        label: "議会運営委員会②（本会議休憩中）",
        url: "https://example.com/2",
      },
    ]);
  });

  it("動画を読み取れない形のときは元の文章をそのまま返す", () => {
    expect(parseSourceNote("動画: 準備中")).toEqual({
      text: "動画: 準備中",
      videos: [],
      usesSpeechRecognition: false,
    });
  });

  it("音声認識で文字にした記録を見分ける", () => {
    expect(
      parseSourceNote(
        "田川市議会公式YouTubeチャンネルの中継映像の音声を文字起こし（自動字幕が無いため音声認識 Whisper を使用。誤変換を含む）したものです。"
      )
    ).toEqual({ text: null, videos: [], usesSpeechRecognition: true });
  });
});
