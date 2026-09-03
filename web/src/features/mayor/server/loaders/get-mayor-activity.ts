import "server-only";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import type { BillWithContentLite } from "@/features/bills/shared/types";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { getBillsByProposer } from "@/features/members/server/loaders/get-member-vote-data";
import {
  MAYOR_ACTIONS,
  MAYOR_PROFILE,
  ROAD_TO_INAUGURATION,
  type TimelineEvent,
  UPCOMING_SESSION,
  type UpcomingSession,
} from "../../shared/data/mayor-profile";
import {
  createSourceResolver,
  filterBillsSince,
  newestFirst,
  type ResolvedLink,
  sessionTimingLabel,
} from "../../shared/utils/mayor-activity";

export interface TimelineItem extends TimelineEvent {
  /** 出典へのリンク。一覧から引けなかった場合は null */
  link: ResolvedLink | null;
}

export type UpcomingSessionView = UpcomingSession & {
  /** 「あと4日で開会」「会期中（10.8まで）」のような今の段階 */
  timingLabel: string;
  link: ResolvedLink | null;
};

export interface MayorActivity {
  /** 就任後にしたこと（新しい順、出典リンク解決済み） */
  actions: TimelineItem[];
  /** 就任日以降に提出された市長提出議案 */
  billsSinceInauguration: BillWithContentLite[];
  /** 市長交代の経緯（古い順、出典リンク解決済み） */
  background: TimelineItem[];
  /** 次の定例会の予告。会期が終わっていれば null */
  upcoming: UpcomingSessionView | null;
}

/**
 * 新市長の特設ページ用のデータをまとめて取得する。
 * どれも unstable_cache 済みの一覧を土台にするため、追加のDBアクセスは無い
 * （getBillsByProposer 内の getBillsLite は React cache() で重複排除される）
 */
export async function getMayorActivity(now: Date): Promise<MayorActivity> {
  const [meetings, allBills, mayorBills] = await Promise.all([
    getCommitteeMeetingListItems(),
    getBillsLite(),
    getBillsByProposer("mayor"),
  ]);

  const resolve = createSourceResolver({ meetings, bills: allBills });
  const withLink = (event: TimelineEvent): TimelineItem => ({
    ...event,
    link: resolve(event.source),
  });
  const timingLabel = sessionTimingLabel(UPCOMING_SESSION, now);

  return {
    actions: newestFirst(MAYOR_ACTIONS).map(withLink),
    billsSinceInauguration: filterBillsSince(
      mayorBills,
      MAYOR_PROFILE.inaugurationDate
    ),
    background: ROAD_TO_INAUGURATION.map(withLink),
    upcoming: timingLabel
      ? {
          ...UPCOMING_SESSION,
          timingLabel,
          link: resolve(UPCOMING_SESSION.source),
        }
      : null,
  };
}
