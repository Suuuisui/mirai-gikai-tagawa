import type { MetadataRoute } from "next";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import { getLatestUpdatedAt } from "@/features/bills/shared/utils/latest-updated-at";
import { getCommitteeMeetings } from "@/features/committees/server/loaders/get-committee-meetings";
import { getAllDietSessions } from "@/features/diet-sessions/server/loaders/get-all-diet-sessions";
import { getBillsWithMemberVotes } from "@/features/members/server/loaders/get-member-vote-data";
import { aggregateMemberSummaries } from "@/features/members/shared/utils/aggregate-members";
import { PROPOSER_TYPES } from "@/features/members/shared/utils/proposer";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

// ISR: 議案データ更新時は /api/revalidate で即時反映（タイマーは保険）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.webUrl;

  const [bills, sessions, billsWithMemberVotes, committeeMeetings] =
    await Promise.all([
      getBillsLite(),
      getAllDietSessions(),
      getBillsWithMemberVotes(),
      getCommitteeMeetings(),
    ]);

  // 一覧・アーカイブ系URLのlastModifiedは、リクエストのたびに変動する
  // new Date() ではなく、取得済みの議案データの updated_at 最大値を使う
  // （追加クエリを増やさず、実際のデータ更新に連動させるため）
  const latestBillUpdatedAt = getLatestUpdatedAt(bills, new Date());

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}${routes.billDetail(bill.id)}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const committeeMeetingUrls = committeeMeetings.map((meeting) => ({
    url: `${baseUrl}${routes.committeeMeeting(meeting.id)}`,
    lastModified: new Date(meeting.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const sessionUrls = sessions.map((session) => ({
    url: `${baseUrl}${routes.sessionSummary(session.id)}`,
    lastModified: new Date(session.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const memberUrls = aggregateMemberSummaries(billsWithMemberVotes).map(
    (member) => ({
      url: `${baseUrl}${routes.memberDetail(member.name)}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })
  );

  // 会期別議案一覧（/archive/{slug}/bills）。slug未設定の会期は除外
  const archiveSessionUrls = sessions
    .filter(
      (session): session is typeof session & { slug: string } =>
        session.slug !== null
    )
    .map((session) => ({
      url: `${baseUrl}${routes.archiveSessionBills(session.slug)}`,
      lastModified: new Date(session.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // タグ別議案一覧（/tags/{tagId}）。取得済みの議案データから一意なタグを導出
  const tagIds = [
    ...new Set(bills.flatMap((bill) => bill.tags.map((t) => t.id))),
  ];
  const tagUrls = tagIds.map((tagId) => ({
    url: `${baseUrl}${routes.tagBills(tagId)}`,
    lastModified: latestBillUpdatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const proposerUrls = PROPOSER_TYPES.map((proposer) => ({
    url: `${baseUrl}${routes.proposerBills(proposer)}`,
    lastModified: latestBillUpdatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      // トップも他の一覧系と同じく実データの更新に連動させる
      lastModified: latestBillUpdatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}${routes.search()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.sessionArchive()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.memberArchive()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.archive()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.committees()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    // 利用規約・プライバシーポリシーはbillデータと無関係な固定ページのため、
    // 他エントリと違いlastModifiedにlatestBillUpdatedAtを流用しない（省略可能）
    {
      url: `${baseUrl}${routes.terms()}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}${routes.privacy()}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    ...billUrls,
    ...sessionUrls,
    ...archiveSessionUrls,
    ...tagUrls,
    ...memberUrls,
    ...proposerUrls,
    ...committeeMeetingUrls,
  ];
}
