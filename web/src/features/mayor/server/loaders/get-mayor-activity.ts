import "server-only";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import type { BillWithContentLite } from "@/features/bills/shared/types";
import { getCommitteeMeetings } from "@/features/committees/server/loaders/get-committee-meetings";
import type { CommitteeMeetingSummary } from "@/features/committees/shared/types";
import { getCurrentDietSession } from "@/features/diet-sessions/server/loaders/get-current-diet-session";
import { getBillsByProposer } from "@/features/members/server/loaders/get-member-vote-data";
import {
  MAYOR_PROFILE,
  ROAD_TO_INAUGURATION,
  type TimelineEvent,
  UPCOMING_SESSION,
  type UpcomingSession,
} from "../../shared/data/mayor-profile";
import {
  createSourceResolver,
  filterBillsSince,
  filterMeetingsSince,
  type ResolvedLink,
  shouldShowUpcomingSession,
} from "../../shared/utils/mayor-activity";

export interface TimelineItem extends TimelineEvent {
  /** 出典へのリンク。一覧から引けなかった場合は null */
  link: ResolvedLink | null;
}

export interface MayorActivity {
  /** 就任日以降に開かれた委員会の記録（新しい順） */
  meetingsSinceInauguration: CommitteeMeetingSummary[];
  /** 就任日以降に提出された市長提出議案 */
  billsSinceInauguration: BillWithContentLite[];
  /** 就任までの経緯（出典リンク解決済み） */
  timeline: TimelineItem[];
  /**
   * 次の定例会の予告。就任後の議案が既に公開されているか、会期が始まって
   * いる（DBの会期に入っている）ときは null にして二重の情報源を作らない
   */
  upcoming: (UpcomingSession & { link: ResolvedLink | null }) | null;
}

/**
 * 新市長の特設ページ用のデータをまとめて取得する。
 * どれも unstable_cache 済みの一覧を土台にするため、追加のDBアクセスは無い
 * （getBillsByProposer 内の getBillsLite は React cache() で重複排除される）
 */
export async function getMayorActivity(now: Date): Promise<MayorActivity> {
  const [allMeetings, allBills, mayorBills, currentSession] = await Promise.all(
    [
      getCommitteeMeetings(),
      getBillsLite(),
      getBillsByProposer("mayor"),
      getCurrentDietSession(now),
    ]
  );

  const since = MAYOR_PROFILE.inaugurationDate;
  const billsSinceInauguration = filterBillsSince(mayorBills, since);
  const resolve = createSourceResolver({
    meetings: allMeetings,
    bills: allBills,
  });

  return {
    meetingsSinceInauguration: filterMeetingsSince(allMeetings, since),
    billsSinceInauguration,
    timeline: ROAD_TO_INAUGURATION.map((event) => ({
      ...event,
      link: resolve(event.source),
    })),
    upcoming: shouldShowUpcomingSession(
      billsSinceInauguration.length,
      currentSession !== null
    )
      ? { ...UPCOMING_SESSION, link: resolve(UPCOMING_SESSION.source) }
      : null,
  };
}
