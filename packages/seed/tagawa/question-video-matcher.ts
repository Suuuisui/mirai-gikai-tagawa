/**
 * 公式YouTubeチャンネルの「一般質問」動画を、質問の記録に結び付ける【田川市専用】
 *
 * 動画タイトルは「【令和8年9月11日】梶原みつ子議員　一般質問（田川市議会9月定例会）」
 * 「【令和7年3月4日】一般質問 　今村寿人議員〔孔志会〕（田川市議会3月定例会）」の
 * 2通りの並びがあるため、日付と「〇〇議員」だけを見る。
 * 純粋関数のみ。テストは question-video-matcher.test.ts
 */

import { parseWarekiDate } from "./council-html-utils";
import { compactName } from "./council-names";
import { normalizeDigits } from "./http-utils";

export interface QuestionVideo {
  id: string;
  title: string;
}

export interface QuestionVideoKey {
  /** 質問日（YYYY-MM-DD） */
  date: string;
  /** 照合用に空白と異体字を寄せた氏名 */
  name: string;
}

/** 動画タイトルから質問日と議員名を読み取る。一般質問の動画でなければ null */
export function parseQuestionVideoTitle(title: string): QuestionVideoKey | null {
  if (!title.includes("一般質問")) return null;
  const bracket = title.match(/【([^】]+)】/);
  const date = bracket ? parseWarekiDate(bracket[1]) : null;
  const name = normalizeDigits(title).match(/([^\s【】（）〔〕()　]+?)議員/);
  if (!date || !name) return null;
  return { date, name: compactName(name[1]) };
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * 質問の記録（id・質問日・議員名）に動画URLを割り当てる。
 * 同じ日・同じ議員の動画が見つかったときだけ結び付ける
 */
export function matchQuestionVideos(
  records: ReadonlyArray<{ id: string; questionDate: string | null; memberName: string }>,
  videos: readonly QuestionVideo[]
): Map<string, string> {
  const byKey = new Map<string, string>();
  for (const video of videos) {
    const key = parseQuestionVideoTitle(video.title);
    if (key) byKey.set(`${key.date}#${key.name}`, youtubeWatchUrl(video.id));
  }
  const result = new Map<string, string>();
  for (const record of records) {
    if (!record.questionDate) continue;
    const url = byKey.get(`${record.questionDate}#${compactName(record.memberName)}`);
    if (url) result.set(record.id, url);
  }
  return result;
}
