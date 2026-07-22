import type { MetadataRoute } from "next";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { getLatestUpdatedAt } from "@/features/bills/shared/utils/latest-updated-at";
import { getAllDietSessions } from "@/features/diet-sessions/server/loaders/get-all-diet-sessions";
import { getBillsWithMemberVotes } from "@/features/members/server/loaders/get-member-vote-data";
import { aggregateMemberSummaries } from "@/features/members/shared/utils/aggregate-members";
import { PROPOSER_TYPES } from "@/features/members/shared/utils/proposer";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.webUrl;

  const [bills, sessions, billsWithMemberVotes] = await Promise.all([
    getBills(),
    getAllDietSessions(),
    getBillsWithMemberVotes(),
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

  const proposerUrls = PROPOSER_TYPES.map((proposer) => ({
    url: `${baseUrl}${routes.proposerBills(proposer)}`,
    lastModified: latestBillUpdatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
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
    ...billUrls,
    ...sessionUrls,
    ...memberUrls,
    ...proposerUrls,
  ];
}
