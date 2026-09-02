import type { Route } from "next";
import { getCommitteeProfile } from "@/features/committees/shared/data/committee-profiles";
import { routes } from "@/lib/routes";
import { toDateString } from "@/lib/utils/date";
import type { TimelineSource } from "../data/mayor-profile";

/** ISO日付文字列（YYYY-MM-DD…）の日付部分をUTC深夜のミリ秒に変換する */
function toDayMs(dateString: string): number {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** 「浦野 仁」→「浦野仁」。見出しや文中で分かち書きしない箇所に使う */
export function compactName(name: string): string {
  return name.replace(/\s+/g, "");
}

/**
 * 次の定例会の予告を出すか。就任後の議案が公開済みか、会期がDBに登録されて
 * 会期中になっていれば、情報源が二重になるので出さない
 */
export function shouldShowUpcomingSession(
  billCount: number,
  inSession: boolean
): boolean {
  return billCount === 0 && !inSession;
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
  const diff =
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
    toDayMs(inaugurationDate);
  return diff < 0 ? 0 : Math.floor(diff / 86_400_000) + 1;
}

/**
 * 基準日以降に開かれた会議を返す。並び順は入力のまま
 * （getCommitteeMeetings() は開催日の降順で返す）
 */
export function filterMeetingsSince<T extends { meeting_date: string }>(
  meetings: readonly T[],
  since: string
): T[] {
  const sinceMs = toDayMs(since);
  return meetings.filter((meeting) => toDayMs(meeting.meeting_date) >= sinceMs);
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

export interface PointPatterns {
  include: RegExp;
  exclude: RegExp;
}

/**
 * 要点のうち include に当たり exclude に当たらないものを最大max件拾う。
 * 語そのものはデータ層（mayor-profile.ts の MAYOR_POINT_PATTERNS）が持つ
 */
export function pickPointsMatching(
  points: readonly string[],
  patterns: PointPatterns,
  max = 3
): string[] {
  return points
    .filter(
      (point) => patterns.include.test(point) && !patterns.exclude.test(point)
    )
    .slice(0, max);
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
