import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";

type SitemapEntry = MetadataRoute.Sitemap[number];
type DateLike = string | Date | null | undefined;

function toValidDate(value: DateLike): Date | undefined {
  if (value === null || value === undefined) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * 日付の中で最も新しいものを返す。日付として読めない値は無視し、
 * 1 つも無ければ undefined（sitemap の lastModified を省く）。
 * 「いまの時刻」で埋めない: 毎回変わる lastmod は、検索エンジンに信用されなくなるため
 */
export function latestOf(values: readonly DateLike[]): Date | undefined {
  let latest: Date | undefined;
  for (const value of values) {
    const date = toValidDate(value);
    if (date && (!latest || date > latest)) latest = date;
  }
  return latest;
}

/**
 * items をキーごとに分け、キーごとの最新の日時を返す。
 * 会期ごと・タグごと・議員ごとのページの lastModified を、
 * そのページに載っている議案の更新日時から求めるのに使う
 */
export function latestDateByKey<T>(
  items: readonly T[],
  keysOf: (item: T) => readonly string[],
  dateOf: (item: T) => DateLike
): Map<string, Date> {
  const result = new Map<string, Date>();
  for (const item of items) {
    const date = toValidDate(dateOf(item));
    if (!date) continue;
    for (const key of keysOf(item)) {
      const current = result.get(key);
      if (!current || date > current) result.set(key, date);
    }
  }
  return result;
}

/**
 * 会期ごとの一般質問ページの lastModified。
 * 質問の最終日と、その会期の質問日に登録された本会議（一般質問）の記録の更新日時のうち、
 * 最も新しいもの。質問の通告は公式サイトから取り込んだ静的データで更新日時を持たないため、
 * ページに載る日付とリンク先の記録の更新から求める。
 * 質問日は通告で予定された日付なので、会期の前や途中では未来になる。未来の lastmod は
 * 検索エンジンに信用されなくなるため、today より後の最終日は候補から外す（今日ちょうどは含む）
 */
export function latestQuestionSessionDate({
  firstDate,
  lastDate,
  answerRecords,
  today,
}: {
  firstDate: string | null;
  lastDate: string | null;
  /** 本会議（一般質問）の記録（開催日と更新日時） */
  answerRecords: ReadonlyArray<{ meeting_date: string; updated_at: string }>;
  /** 今日の日付（JST の YYYY-MM-DD）。呼び出し側で求める（この関数は現在時刻を読まない） */
  today: string;
}): Date | undefined {
  const inSession =
    firstDate && lastDate
      ? answerRecords.filter(
          (record) =>
            record.meeting_date >= firstDate && record.meeting_date <= lastDate
        )
      : [];
  const pastLastDate = lastDate && lastDate <= today ? lastDate : null;
  return latestOf([
    pastLastDate,
    ...inSession.map((record) => record.updated_at),
  ]);
}

/** 公開中のトピック分析がある議案と、そのトピックの ID */
export interface PublishedTopicPage {
  billId: string;
  /** 分析を作った日時。不明なら null */
  generatedAt: string | null;
  topicIds: readonly string[];
}

/**
 * 公開中のトピック分析ページ（議案ごとの一覧と、トピックごとの詳細）の sitemap 項目。
 * 公開されている議案のものだけを載せる。公開中のトピックが 1 つも無ければ空
 */
export function buildTopicSitemapEntries({
  baseUrl,
  pages,
  publishedBillIds,
}: {
  baseUrl: string;
  pages: readonly PublishedTopicPage[];
  publishedBillIds: ReadonlySet<string>;
}): SitemapEntry[] {
  return pages
    .filter((page) => page.topicIds.length > 0)
    .filter((page) => publishedBillIds.has(page.billId))
    .flatMap((page) => {
      const lastModified = toValidDate(page.generatedAt);
      return [
        {
          url: `${baseUrl}${routes.billTopics(page.billId)}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        },
        ...page.topicIds.map((topicId) => ({
          url: `${baseUrl}${routes.billTopicDetail(page.billId, topicId)}`,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        })),
      ];
    });
}

/**
 * 公開中の AIインタビューの案内ページの sitemap 項目。
 * 公開中のインタビューがある議案（hasPublicInterview）だけを載せる。無ければ空
 */
export function buildInterviewSitemapEntries({
  baseUrl,
  bills,
}: {
  baseUrl: string;
  bills: ReadonlyArray<{
    id: string;
    updated_at: string;
    hasPublicInterview?: boolean;
  }>;
}): SitemapEntry[] {
  return bills
    .filter((bill) => bill.hasPublicInterview === true)
    .map((bill) => ({
      url: `${baseUrl}${routes.interviewLP(bill.id)}`,
      lastModified: toValidDate(bill.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
}
