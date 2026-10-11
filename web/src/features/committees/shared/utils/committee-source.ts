import type { SourceKind } from "@/features/sources/shared/data/source-kinds";
import type { CommitteeMeetingSourceType } from "../types";

export interface CommitteeSourceInfo {
  /** サイト共通の出典の区分 */
  kind: SourceKind;
  /** バッジに添える、何の資料か */
  detail: string;
  /** 「このページは、〜をもとに」の「〜」 */
  basis: string;
}

/** 会議の記録のもと（DBの source_type）と、サイト共通の出典の区分の対応 */
export const COMMITTEE_SOURCES: Record<
  CommitteeMeetingSourceType,
  CommitteeSourceInfo
> = {
  minutes: {
    kind: "official",
    detail: "会議録",
    basis: "田川市議会の会議録検索システムで公開されている本会議の会議録",
  },
  youtube: {
    kind: "transcript",
    detail: "YouTube中継",
    basis: "田川市議会の公式YouTube中継の音声の文字起こし",
  },
  disclosure: {
    kind: "disclosure",
    detail: "開示文書",
    basis: "田川市への情報開示請求により入手した文書",
  },
};

/**
 * DBの source_type を画面で扱う型に直す。
 * 知らない値は「中継の文字起こし」として扱う（一番注意書きの多い区分に倒す）
 */
export function toCommitteeSourceType(
  value: string
): CommitteeMeetingSourceType {
  return value === "minutes" || value === "disclosure" ? value : "youtube";
}

/** 出典の区分ごとの会議数 */
export function countMeetingsBySourceKind(
  meetings: readonly { source_type: CommitteeMeetingSourceType }[]
): Record<SourceKind, number> {
  const counts: Record<SourceKind, number> = {
    official: 0,
    transcript: 0,
    disclosure: 0,
  };
  for (const meeting of meetings) {
    counts[COMMITTEE_SOURCES[meeting.source_type].kind] += 1;
  }
  return counts;
}

/** 出典の補足（source_note）から取り出した中継動画へのリンク */
export interface SourceVideoLink {
  /** 動画の名前（例: 佐藤俊一議員（日本共産党市会議員団）） */
  label: string;
  url: string;
}

export interface ParsedSourceNote {
  /**
   * 画面に添える補足の文章。決まり文句（どの資料をもとにしたか）だけの補足は
   * バッジと注意書きで伝わるので null にする
   */
  text: string | null;
  /** 議員ごと・パートごとの中継動画（1本だけの会議は空。youtube_url を使う） */
  videos: SourceVideoLink[];
  /** 自動字幕が無く、音声認識で文字にした記録かどうか */
  usesSpeechRecognition: boolean;
}

const VIDEO_LIST_MARKER = "動画: ";

/** 取り込みスクリプトが入れる決まり文句の書き出し（これで始まる補足は画面に重ねて出さない） */
const BOILERPLATE_PREFIXES = [
  "田川市議会公式YouTubeチャンネルの中継映像",
  "田川市への情報開示請求により入手した文書をもとにしています。",
  "田川市議会 会議録検索システムで公開されている本会議の会議録をもとにしています。",
];

/**
 * 出典の補足を、文章と中継動画のリンク一覧に分ける。
 * 一般質問の日（議員ごとに1本）や、同じ日に何本かに分かれた会議の記録は
 * 「…したものです。動画: 名前 URL / 名前 URL」の形で動画を並べている
 */
export function parseSourceNote(note: string | null): ParsedSourceNote {
  const trimmed = note?.trim() ?? "";
  const usesSpeechRecognition = trimmed.includes("音声認識");
  if (trimmed === "") {
    return { text: null, videos: [], usesSpeechRecognition };
  }

  const markerIndex = trimmed.indexOf(VIDEO_LIST_MARKER);
  const videos =
    markerIndex === -1
      ? []
      : trimmed
          .slice(markerIndex + VIDEO_LIST_MARKER.length)
          .split(" / ")
          .flatMap((entry) => {
            const match = /^(.*?)\s*(https?:\/\/\S+)$/.exec(entry.trim());
            return match && match[1] !== ""
              ? [{ label: match[1], url: match[2] }]
              : [];
          });
  // 動画を1本も読み取れなかったら、元の文章をそのまま見せる（情報を落とさない）
  const body = videos.length > 0 ? trimmed.slice(0, markerIndex) : trimmed;
  const text = body.replace(/\s+/g, " ").trim();
  const isBoilerplate = BOILERPLATE_PREFIXES.some((prefix) =>
    text.startsWith(prefix)
  );
  return {
    text: text === "" || isBoilerplate ? null : text,
    videos,
    usesSpeechRecognition,
  };
}
