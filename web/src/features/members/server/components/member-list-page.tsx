import { Building2, ChevronRight, UserRound, UsersRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
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
  countBillsByProposer,
  getBillsWithMemberVotes,
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
  const [items, proposerCounts] = await Promise.all([
    getBillsWithMemberVotes(),
    countBillsByProposer(),
  ]);
  const members = aggregateMemberSummaries(items);
  const factionGroups = groupByLatestFaction(members);

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
                  const { yes, no, absent, not_voting } = member.counts;
                  return (
                    <Link
                      key={member.name}
                      href={routes.memberDetail(member.name) as Route}
                    >
                      <Card className="flex h-full flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                        <span className="flex items-center justify-between font-bold text-mirai-text">
                          {member.name}
                          <ChevronRight className="h-4 w-4 shrink-0 text-mirai-text-muted" />
                        </span>
                        {/* 賛成・反対の比率バー（幅は票数比によるレイアウト計算のため
                            style を使用。色指定はクラスで行っている） */}
                        {yes + no > 0 && (
                          <div
                            className="flex h-1.5 w-full overflow-hidden rounded-full bg-mirai-surface-muted"
                            role="img"
                            aria-label={`賛成${yes}対反対${no}`}
                          >
                            <div
                              className="basis-0 bg-vote-for"
                              style={{ flexGrow: yes }}
                            />
                            <div
                              className="basis-0 bg-stance-against"
                              style={{ flexGrow: no }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-mirai-text-secondary">
                          賛成{yes}・反対{no}
                          {absent > 0 && `・欠席${absent}`}
                          {not_voting > 0 && `・採決に加わらず${not_voting}`}
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
            ※議員提出議案の提出者個人名は公開データに記載がないため、提出議案は市長・議員・委員会の区分単位で掲載しています。
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
