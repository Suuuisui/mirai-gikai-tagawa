import type { Route } from "next";
import { getCommitteeProfile } from "@/features/committees/shared/data/committee-profiles";
import { routes } from "@/lib/routes";
import { formatDateWithDots, toDateString } from "@/lib/utils/date";
import type { TimelineSource, UpcomingSession } from "../data/mayor-profile";

const DAY_MS = 86_400_000;

/** ISO日付文字列（YYYY-MM-DD…）の日付部分をUTC深夜のミリ秒に変換する */
function toDayMs(dateString: string): number {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** now（getJapanTime() が返すJST基準のDate）の日付部分をUTC深夜のミリ秒に */
function todayMs(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/** 「浦野 仁」→「浦野仁」。見出しや文中で分かち書きしない箇所に使う */
export function compactName(name: string): string {
  return name.replace(/\s+/g, "");
}

/** 満年齢を求める（now は getJapanTime() が返すJST基準のDate） */
export function calculateAge(birthDate: string, now: Date): number {
  const age = now.getFullYear() - Number(birthDate.slice(0, 4));
  return toDateString(now).slice(5) < birthDate.slice(5) ? age - 1 : age;
}

/**
 * 「就任N日目」のN。就任日当日を1日目と数える。
 * 就任前なら0を返す（表示側で出し分ける）
 */
export function daysSinceInauguration(
  inaugurationDate: string,
  now: Date
): number {
  const diff = todayMs(now) - toDayMs(inaugurationDate);
  return diff < 0 ? 0 : Math.floor(diff / DAY_MS) + 1;
}

/** 指定日まであと何日か。当日は0、過ぎていれば負の数 */
export function daysUntil(dateString: string, now: Date): number {
  return Math.round((toDayMs(dateString) - todayMs(now)) / DAY_MS);
}

/**
 * 予定されている会期の見出しに添える一言。開会前は「あとN日で開会」、
 * 会期中は「会期中（閉会日まで）」、閉会後は null（予告を出さない合図）
 */
export function sessionTimingLabel(
  session: Pick<UpcomingSession, "startDate" | "endDate">,
  now: Date
): string | null {
  const untilStart = daysUntil(session.startDate, now);
  if (untilStart > 0) return `あと${untilStart}日で開会`;
  if (untilStart === 0) return "きょう開会";
  if (daysUntil(session.endDate, now) >= 0) {
    return `会期中（${formatDateWithDots(session.endDate)}まで）`;
  }
  return null;
}

/** 日付の新しい順に並べ替える（同じ日は元の順を保つ。元の配列は変えない） */
export function newestFirst<T extends { date: string }>(
  events: readonly T[]
): T[] {
  return [...events].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 基準日以降に提出された議案を返す。提出日が無い議案は判断できないため
 * 含めない。並び順は入力のまま（getBillsLite() は議決日の降順で返す）
 */
export function filterBillsSince<T extends { submitted_date: string | null }>(
  bills: readonly T[],
  since: string
): T[] {
  const sinceMs = toDayMs(since);
  return bills.filter(
    (bill) =>
      bill.submitted_date !== null && toDayMs(bill.submitted_date) >= sinceMs
  );
}

export interface VoteShare {
  /** 候補者の得票合計に占める割合（%、小数1桁） */
  percent: number;
  /** 最多得票を100としたときの長さ（棒グラフ用、整数） */
  relative: number;
}

/** 各候補者に得票率と、最多得票を基準にした棒の長さを添えて返す（順序は入力のまま） */
export function calculateVoteShares<T extends { votes: number }>(
  candidates: readonly T[]
): (T & VoteShare)[] {
  const total = candidates.reduce((sum, c) => sum + c.votes, 0);
  const max = Math.max(0, ...candidates.map((c) => c.votes));
  return candidates.map((c) => ({
    ...c,
    percent: total === 0 ? 0 : Math.round((c.votes / total) * 1000) / 10,
    relative: max === 0 ? 0 : Math.round((c.votes / max) * 100),
  }));
}

/** 出典へのリンク。外部は新しいタブで開き、内部は typedRoutes の Route を保つ */
export type ResolvedLink =
  | { external: true; href: string; label: string }
  | { external: false; href: Route; label: string };

export interface SourceLists {
  meetings: readonly {
    id: string;
    committee_name: string;
    meeting_date: string;
  }[];
  bills: readonly { id: string; name: string }[];
}

/** 会議は「委員会名|開催日」で引く（IDはローカルと本番で異なるため持たない） */
function meetingKey(committeeName: string, meetingDate: string): string {
  return `${committeeName}|${meetingDate.slice(0, 10)}`;
}

/**
 * 出典→リンクの解決関数を作る。索引は一度だけ組み、返す関数は
 * その索引だけを保持する（一覧の配列そのものは捕まえない）
 */
export function createSourceResolver(
  lists: SourceLists
): (source: TimelineSource) => ResolvedLink | null {
  const meetingIds = new Map(
    lists.meetings.map((m) => [
      meetingKey(m.committee_name, m.meeting_date),
      m.id,
    ])
  );
  const billIds = new Map(lists.bills.map((b) => [b.name, b.id]));

  return (source) => {
    if (source.kind === "official") {
      return { href: source.url, label: source.label, external: true };
    }
    if (source.kind === "bill") {
      const id = billIds.get(source.billName);
      return id
        ? {
            href: routes.billDetail(id) as Route,
            label: "議案を見る",
            external: false,
          }
        : null;
    }
    const id = meetingIds.get(
      meetingKey(source.committeeName, source.meetingDate)
    );
    return id
      ? {
          href: routes.committeeMeeting(id) as Route,
          label: `${getCommitteeProfile(source.committeeName).shortName}の記録`,
          external: false,
        }
      : null;
  };
}
