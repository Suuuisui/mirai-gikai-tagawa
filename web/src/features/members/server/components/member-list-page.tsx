import { Building2, ChevronRight, UserRound, UsersRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { ROSTER_AS_OF } from "../../shared/data/member-profiles";
import {
  aggregateMemberSummaries,
  type MemberSummary,
} from "../../shared/utils/aggregate-members";
import { formatYearMonth } from "../../shared/utils/format-year-month";
import {
  PROPOSER_DESCRIPTIONS,
  PROPOSER_LABELS,
  PROPOSER_TYPES,
  type ProposerType,
} from "../../shared/utils/proposer";
import {
  resolveMemberDisplayName,
  resolveMemberProfile,
} from "../../shared/utils/resolve-member-display";
import {
  collectSponsorNames,
  extractFamilyName,
} from "../../shared/utils/sponsors";
import {
  countBillsByProposer,
  getBillsWithMemberVotes,
  getBillsWithSponsors,
} from "../loaders/get-member-vote-data";

const PROPOSER_ICONS: Record<
  ProposerType,
  typeof Building2 | typeof UserRound | typeof UsersRound
> = {
  mayor: Building2,
  member: UserRound,
  committee: UsersRound,
};

/** 直近の所属会派ごとに議員をグループ化する（人数の多い会派順） */
function groupByLatestFaction(
  members: MemberSummary[]
): Array<{ faction: string; members: MemberSummary[] }> {
  const map = new Map<string, MemberSummary[]>();
  for (const member of members) {
    const group = map.get(member.latestFaction) ?? [];
    group.push(member);
    map.set(member.latestFaction, group);
  }
  return [...map.entries()]
    .map(([faction, groupMembers]) => ({ faction, members: groupMembers }))
    .sort(
      (a, b) =>
        b.members.length - a.members.length ||
        a.faction.localeCompare(b.faction, "ja")
    );
}

/**
 * 議員・提出者から見るページ
 *
 * 田川市議会が公開している「賛否が分かれた案件」の議員別賛否データを
 * 議員ごとに集計した一覧と、提出者区分（市長/議員/委員会）別の議案一覧への
 * 入口をまとめたページ
 */
export async function MemberListPage() {
  const [items, proposerCounts, sponsoredBills] = await Promise.all([
    getBillsWithMemberVotes(),
    countBillsByProposer(),
    getBillsWithSponsors(),
  ]);
  const members = aggregateMemberSummaries(items);
  const factionGroups = groupByLatestFaction(members);

  // sponsorsデータ中のフルネーム一覧（MEMBER_PROFILESに無い姓のフォールバック用）
  const allSponsorNames = collectSponsorNames(
    sponsoredBills.map(({ sponsors }) => sponsors)
  );

  // 議員（姓）ごとの提出議案数（同じ議案に複数回登場しても1件として数える）
  const proposalCounts = new Map<string, number>();
  for (const { sponsors } of sponsoredBills) {
    const familyNames = new Set(
      sponsors.proposers.map((person) => extractFamilyName(person.name))
    );
    for (const familyName of familyNames) {
      proposalCounts.set(familyName, (proposalCounts.get(familyName) ?? 0) + 1);
    }
  }

  // 集計対象期間（賛否データが紐づく議案の議決日の範囲）
  const dates = items
    .map((item) => item.bill.submitted_date)
    .filter((date): date is string => date !== null)
    .sort();
  const coverage =
    dates.length > 0
      ? `${formatYearMonth(dates[0])}〜${formatYearMonth(dates[dates.length - 1])}議決分・${items.length}議案`
      : null;

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-1.5 pb-8">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            議員・提出者から見る
          </h1>
          <p className="text-xs text-mirai-text-secondary">
            誰が提出し、誰が賛成・反対したのか。田川市議会の公開データから、議案を「人」の視点でたどれます。
          </p>
        </div>

        {/* 提出者区分別の議案一覧への入口 */}
        <section className="flex flex-col gap-3 pb-10">
          <h2 className="text-lg font-bold text-mirai-text">
            提出者から議案をさがす
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PROPOSER_TYPES.map((type) => {
              const Icon = PROPOSER_ICONS[type];
              return (
                <Link key={type} href={routes.proposerBills(type) as Route}>
                  <Card className="flex h-full flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-mirai-text">
                        <Icon className="h-4 w-4 shrink-0 text-primary-accent" />
                        {PROPOSER_LABELS[type]}
                      </span>
                      <span className="flex items-center text-xs font-medium text-mirai-text-muted">
                        {proposerCounts[type]}件
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="text-xs leading-[1.6] text-mirai-text-secondary">
                      {PROPOSER_DESCRIPTIONS[type]}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 議員別の賛否サマリー */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-mirai-text">
              議員ごとの賛否
            </h2>
            <p className="text-xs text-mirai-text-secondary">
              賛否が分かれた案件{coverage ? `（${coverage}）` : ""}
              での各議員の投票を集計しています。名前を選ぶと議案ごとの賛否を確認できます。
            </p>
          </div>

          {factionGroups.map((group) => (
            <div key={group.faction} className="flex flex-col gap-2 pt-2">
              <h3 className="text-sm font-bold text-mirai-text-secondary">
                {group.faction}（{group.members.length}人）
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.members.map((member) => {
                  const proposalCount = proposalCounts.get(member.name);
                  const profile = resolveMemberProfile(member.name);
                  const displayName = resolveMemberDisplayName(
                    member.name,
                    allSponsorNames
                  );
                  const role =
                    profile?.isIncumbent && profile.role ? profile.role : null;
                  return (
                    <Link
                      key={member.name}
                      href={routes.memberDetail(member.name) as Route}
                    >
                      <Card className="flex h-full flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                        <span className="flex items-center justify-between gap-2 font-bold text-mirai-text">
                          <span className="flex flex-col">
                            {displayName}
                            {role && (
                              <span className="text-xs font-normal text-mirai-text-muted">
                                {role}
                              </span>
                            )}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-mirai-text-muted" />
                        </span>
                        {/* スマホの2カラムでは1行に収まらないため、項目ごとに縦に積む */}
                        <p className="flex flex-col gap-0.5 text-xs text-mirai-text-muted">
                          <span className="whitespace-nowrap">
                            投票記録 {member.billCount}議案
                          </span>
                          {proposalCount ? (
                            <span className="whitespace-nowrap">
                              提出 {proposalCount}件
                            </span>
                          ) : (
                            ""
                          )}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* データの範囲についての注記 */}
        <div className="mt-10 rounded-md bg-white px-4 py-4 text-xs leading-[1.8] text-mirai-text-note">
          <p>
            ※田川市議会は「賛否が分かれた案件」についてのみ議員別の賛否を公開しており、このページはその公開分を集計したものです。全会一致で議決された議案は含まれません。
          </p>
          <p>※姓が同じ表記の議員は同一人物として集計しています。</p>
          <p>
            ※提出議案は市長・議員・委員会の区分単位で掲載しています。議案説明資料PDFに提出者・賛成者（連署議員）の氏名が記載されている議案では、議案ページで個人名も確認できます。
          </p>
          <p>
            ※氏名・会派・役職は田川市議会公式サイトの議員名簿（{ROSTER_AS_OF}
            時点）より。
          </p>
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "議員・提出者から見る" },
          ]}
        />
      </Container>
    </div>
  );
}
