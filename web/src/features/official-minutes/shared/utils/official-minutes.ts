import { officialMinutesUrl } from "@mirai-gikai/shared/council/official-minutes";
import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";

/** ある日の本会議の会議録（会議録検索システム）へのリンク */
export interface OfficialMinutesLink {
  /** 開催日（YYYY-MM-DD） */
  date: string;
  /** 会議録検索システムでその日の会議録を開くURL */
  url: string;
  /** 会議名（例: 令和8年 第4回定例会） */
  sessionName: string;
  /** 何日目か（例: 第1日） */
  dayLabel: string;
}

export interface OfficialMinutesIndex {
  /** その日の本会議の会議録。公開されていなければ null */
  findByDate: (date: string) => OfficialMinutesLink | null;
  /** 期間内（両端を含む）に開かれた本会議の会議録を古い順に */
  findInRange: (startDate: string, endDate: string) => OfficialMinutesLink[];
  /** 会議録が公開されているいちばん新しい日。1件も無ければ null */
  latestDate: string | null;
  count: number;
}

/**
 * 会議録の一覧（生成データ）から、日付で引ける索引を作る。
 * code は会議録検索システムが田川市議会に割り当てているコード（URLに必要）
 */
export function buildOfficialMinutesIndex(
  records: readonly OfficialMinutesRecord[],
  code: string
): OfficialMinutesIndex {
  const links: OfficialMinutesLink[] = [...records]
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.fileName.localeCompare(b.fileName)
    )
    .map((record) => ({
      date: record.date,
      url: officialMinutesUrl(code, record.fileName),
      sessionName: record.sessionName,
      dayLabel: record.dayLabel,
    }));
  // 同じ日に2つあることは想定しないが、あれば先のもの（ファイル名の若い方）を使う
  const byDate = new Map<string, OfficialMinutesLink>();
  for (const link of links) {
    if (!byDate.has(link.date)) byDate.set(link.date, link);
  }

  return {
    findByDate: (date) => byDate.get(date.slice(0, 10)) ?? null,
    findInRange: (startDate, endDate) =>
      links.filter((link) => link.date >= startDate && link.date <= endDate),
    latestDate: links.at(-1)?.date ?? null,
    count: links.length,
  };
}
