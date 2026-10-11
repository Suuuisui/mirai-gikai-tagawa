/**
 * 田川市議会 会議録検索システム（本会議の会議録）へのリンク【田川市専用】
 *
 * 会議録検索システム（kensakusystem.jp/tagawa）は田川市議会が本会議の会議録を
 * 公開しているサイト。委員会の会議録は載っていない。
 * seed のスクレイパー（会議録の一覧づくり）と web（各ページの「公式の会議録を読む」
 * リンク）の両方から使う
 */

export const OFFICIAL_MINUTES_SYSTEM_NAME = "田川市議会 会議録検索システム";

export const OFFICIAL_MINUTES_BASE_URL = "https://www.kensakusystem.jp/tagawa";

/** 会議録検索システムのトップページ */
export const OFFICIAL_MINUTES_TOP_URL = `${OFFICIAL_MINUTES_BASE_URL}/index.html`;

/**
 * 1日分の会議録を開くURL。
 * code はシステムが田川市議会に割り当てているコード（トップページのリンクに
 * 入っている。一覧を作り直すたびに読み直して生成データに持たせる）
 */
export function officialMinutesUrl(code: string, fileName: string): string {
  return `${OFFICIAL_MINUTES_BASE_URL}/cgi-bin3/ResultFrame.exe?Code=${code}&fileName=${fileName}&startPos=0`;
}

const ERA_START_YEAR = { R: 2018, H: 1988 } as const;

/**
 * 会議録のファイル名（R080612A = 令和8年6月12日、H300612A = 平成30年6月12日）を
 * 開催日（YYYY-MM-DD）に直す。形が違うものは null
 */
export function minutesFileNameToDate(fileName: string): string | null {
  const match = /^([RH])(\d{2})(\d{2})(\d{2})[A-Z]$/.exec(fileName);
  if (!match) return null;
  const year = ERA_START_YEAR[match[1] as "R" | "H"] + Number(match[2]);
  return `${year}-${match[3]}-${match[4]}`;
}
