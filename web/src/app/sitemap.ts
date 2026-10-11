import type { MetadataRoute } from "next";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import { getCommitteeMeetings } from "@/features/committees/server/loaders/get-committee-meetings";
import { buildCommitteeGroups } from "@/features/committees/shared/utils/committee-groups";
import { getCommitteeSlug } from "@/features/committees/shared/utils/committee-slug";
import { getAllDietSessions } from "@/features/diet-sessions/server/loaders/get-all-diet-sessions";
import {
  getQuestionSessionGroups,
  QUESTION_DAY_RECORD_NAME,
} from "@/features/general-questions/server/loaders/get-general-questions";
import {
  getBillsWithMemberVotes,
  getBillsWithSponsors,
} from "@/features/members/server/loaders/get-member-vote-data";
import { aggregateMemberSummaries } from "@/features/members/shared/utils/aggregate-members";
import { PROPOSER_TYPES } from "@/features/members/shared/utils/proposer";
import { extractFamilyName } from "@/features/members/shared/utils/sponsors";
import { getPublishedTopicPages } from "@/features/user-topic-analysis/server/loaders/get-published-topic-pages";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import {
  buildInterviewSitemapEntries,
  buildTopicSitemapEntries,
  latestDateByKey,
  latestOf,
  latestQuestionSessionDate,
  type PublishedTopicPage,
} from "@/lib/seo/sitemap-entries";
import { getJapanTime, toDateString } from "@/lib/utils/date";

// ISR: 議案データ更新時は /api/revalidate で即時反映（タイマーは保険）
export const revalidate = 3600;

/**
 * 公開中のトピック分析ページ。取得に失敗しても sitemap 全体を巻き込まない
 * （トピック分析は補助的な機能で、sitemap が返せなくなる方が損失が大きい）
 */
async function loadPublishedTopicPages(): Promise<PublishedTopicPage[]> {
  try {
    return await getPublishedTopicPages();
  } catch (error) {
    console.error("sitemap: failed to load published topic pages", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.webUrl;

  const [
    bills,
    sessions,
    billsWithMemberVotes,
    billsWithSponsors,
    committeeMeetings,
    topicPages,
  ] = await Promise.all([
    getBillsLite(),
    getAllDietSessions(),
    getBillsWithMemberVotes(),
    getBillsWithSponsors(),
    getCommitteeMeetings(),
    loadPublishedTopicPages(),
  ]);

  // lastModified は「いまの時刻」ではなく、そのページに載っているデータの
  // 更新日時から求める（毎回変わる値は検索エンジンに信用されなくなる）。
  // 追加クエリを増やさないよう、取得済みの議案・会期・委員会記録だけを使う。
  // データが1件も無いときは lastModified を省く
  const latestBillUpdatedAt = latestOf(bills.map((bill) => bill.updated_at));
  const latestCommitteeUpdatedAt = latestOf(
    committeeMeetings.map((meeting) => meeting.updated_at)
  );
  const latestSessionUpdatedAt = latestOf(
    sessions.map((session) => session.updated_at)
  );

  // 会期ごと・タグごとの最新の議案更新日時
  const latestBillBySession = latestDateByKey(
    bills,
    (bill) => (bill.diet_session_id ? [bill.diet_session_id] : []),
    (bill) => bill.updated_at
  );
  const latestBillByTag = latestDateByKey(
    bills,
    (bill) => bill.tags.map((tag) => tag.id),
    (bill) => bill.updated_at
  );

  // 議員ごとの最新の議案更新日時（賛否の記録がある議案と、提出・賛成した議案）
  const latestBillByMemberVote = latestDateByKey(
    billsWithMemberVotes,
    ({ memberVotes }) => memberVotes.entries.map((entry) => entry.name),
    ({ bill }) => bill.updated_at
  );
  const latestBillByMemberSponsor = latestDateByKey(
    billsWithSponsors,
    ({ sponsors }) =>
      [...sponsors.proposers, ...sponsors.supporters].map((person) =>
        extractFamilyName(person.name)
      ),
    ({ bill }) => bill.updated_at
  );

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}${routes.billDetail(bill.id)}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 委員会ごとの記録ページは、その委員会の会議の更新日時のうち最も新しいもの
  const latestMeetingByCommittee = latestDateByKey(
    committeeMeetings,
    (meeting) => [meeting.committee_name],
    (meeting) => meeting.updated_at
  );
  const committeeGroupUrls = buildCommitteeGroups(committeeMeetings).map(
    (group) => ({
      url: `${baseUrl}${routes.committeeGroup(getCommitteeSlug(group.committeeName))}`,
      lastModified: latestMeetingByCommittee.get(group.committeeName),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  const committeeMeetingUrls = committeeMeetings.map((meeting) => ({
    url: `${baseUrl}${routes.committeeMeeting(meeting.id)}`,
    lastModified: new Date(meeting.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 会期のまとめ・議案一覧は、会期の行と、その会期の議案のうち新しい方
  const sessionLastModified = (session: (typeof sessions)[number]) =>
    latestOf([session.updated_at, latestBillBySession.get(session.id)]);

  const sessionUrls = sessions.map((session) => ({
    url: `${baseUrl}${routes.sessionSummary(session.id)}`,
    lastModified: sessionLastModified(session),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const memberUrls = aggregateMemberSummaries(billsWithMemberVotes).map(
    (member) => ({
      url: `${baseUrl}${routes.memberDetail(member.name)}`,
      lastModified: latestOf([
        latestBillByMemberVote.get(member.name),
        latestBillByMemberSponsor.get(member.name),
      ]),
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
      lastModified: sessionLastModified(session),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // タグ別議案一覧（/tags/{tagId}）。取得済みの議案データから一意なタグを導出
  const tagIds = [
    ...new Set(bills.flatMap((bill) => bill.tags.map((t) => t.id))),
  ];
  const tagUrls = tagIds.map((tagId) => ({
    url: `${baseUrl}${routes.tagBills(tagId)}`,
    lastModified: latestBillByTag.get(tagId),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 提出者別の判定には議案本文が要る（重い）ため、全議案の最新更新日時を使う
  const proposerUrls = PROPOSER_TYPES.map((proposer) => ({
    url: `${baseUrl}${routes.proposerBills(proposer)}`,
    lastModified: latestBillUpdatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // 一般質問は静的データ（公式サイトから生成）なので、会期ページの更新日時は
  // 質問の最終日と、その会期の質問日の本会議の記録の更新日時から求める。
  // 質問日は通告で予定された日付で未来のこともあるため、今日（JST）より後は使わない
  const today = toDateString(getJapanTime());
  const answerRecords = committeeMeetings.filter(
    (meeting) => meeting.committee_name === QUESTION_DAY_RECORD_NAME
  );
  const questionGroups = getQuestionSessionGroups();
  const questionSessionEntries = questionGroups.map((group) => ({
    url: `${baseUrl}${routes.questionSession(group.sessionKey)}`,
    lastModified: latestQuestionSessionDate({
      firstDate: group.firstDate,
      lastDate: group.lastDate,
      answerRecords,
      today,
    }),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const latestQuestionUpdatedAt = latestOf(
    questionSessionEntries.map((entry) => entry.lastModified)
  );

  // 公開中のトピック分析・AIインタビューのページ（データが無ければ空）
  const publishedBillIds = new Set(bills.map((bill) => bill.id));
  const topicUrls = buildTopicSitemapEntries({
    baseUrl,
    pages: topicPages,
    publishedBillIds,
  });
  const interviewUrls = buildInterviewSitemapEntries({ baseUrl, bills });

  return [
    {
      url: baseUrl,
      // トップも他の一覧系と同じく実データの更新に連動させる
      lastModified: latestBillUpdatedAt,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    // 投票率ページは議案データと関係しない静的なページなので、利用規約などと同じく lastModified を付けない
    {
      url: `${baseUrl}${routes.elections()}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}${routes.search()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.sessionArchive()}`,
      lastModified: latestOf([latestBillUpdatedAt, latestSessionUpdatedAt]),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    // /mayor の中身は委員会記録が主なので、その更新日時に連動させる
    {
      url: `${baseUrl}${routes.mayor()}`,
      lastModified: latestOf([latestCommitteeUpdatedAt, latestBillUpdatedAt]),
      changeFrequency: "weekly" as const,
      // 市長交代直後で関心が高いため、一覧ページ（0.7）より少し高くする
      priority: 0.8,
    },
    {
      url: `${baseUrl}${routes.memberArchive()}`,
      lastModified: latestBillUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.archive()}`,
      lastModified: latestOf([latestBillUpdatedAt, latestSessionUpdatedAt]),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    // 委員会の記録の一覧は、議案ではなく委員会記録の更新に連動させる
    {
      url: `${baseUrl}${routes.committees()}`,
      lastModified: latestCommitteeUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.questions()}`,
      lastModified: latestQuestionUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    // 請願・陳情は静的データで、審査の経緯は委員会の記録から引くため、その更新に連動させる
    {
      url: `${baseUrl}${routes.petitions()}`,
      lastModified: latestCommitteeUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    // 出典の説明ページ。中の件数は委員会記録に連動するが、説明が主なので月次の扱い
    {
      url: `${baseUrl}${routes.sources()}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
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
    ...committeeGroupUrls,
    ...committeeMeetingUrls,
    ...questionSessionEntries,
    ...topicUrls,
    ...interviewUrls,
  ];
}
