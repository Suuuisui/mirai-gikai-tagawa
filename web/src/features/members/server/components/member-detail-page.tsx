import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import {
  VOTE_ARIA_LABEL,
  VOTE_CHIP_CLASS,
  VOTE_LABEL,
} from "@/features/bills/shared/utils/member-vote-display";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  aggregateMemberSummaries,
  collectMemberVoteRecords,
} from "../../shared/utils/aggregate-members";
import { getBillsWithMemberVotes } from "../loaders/get-member-vote-data";

interface MemberDetailPageProps {
  /** 議員名（姓、デコード済み） */
  name: string;
}

/**
 * 議員個人ページ
 *
 * 賛否が分かれた案件での、この議員の投票記録（賛成・反対・欠席・
 * 採決に加わらず）を議決日の新しい順に一覧表示する
 */
export async function MemberDetailPage({ name }: MemberDetailPageProps) {
  const items = await getBillsWithMemberVotes();
  const summary = aggregateMemberSummaries(items).find(
    (member) => member.name === name
  );

  if (!summary) {
    notFound();
  }

  const records = collectMemberVoteRecords(items, name);
  const { yes, no, absent, not_voting } = summary.counts;

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-1.5 pb-6">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            {summary.name} 議員の賛否
          </h1>
          <p className="text-xs text-mirai-text-secondary">
            会派: {summary.factions.join(" / ")}
            {summary.factions.length > 1 && "（新しい順）"}
          </p>
        </div>

        {/* 集計サマリー */}
        <div className="mb-6 rounded-md bg-white px-4 py-5">
          <p className="text-sm font-bold text-mirai-text">
            賛成{yes}・反対{no}
            {absent > 0 && `・欠席${absent}`}
            {not_voting > 0 && `・採決に加わらず${not_voting}`}
            <span className="ml-1 font-medium text-mirai-text-muted">
              （{summary.billCount}議案）
            </span>
          </p>
          {/* 賛成・反対の比率バー（幅は票数比によるレイアウト計算のため style を
              使用。色指定はクラスで行っている） */}
          {yes + no > 0 && (
            <div
              className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-mirai-surface-muted"
              role="img"
              aria-label={`賛成${yes}対反対${no}`}
            >
              <div className="basis-0 bg-vote-for" style={{ flexGrow: yes }} />
              <div
                className="basis-0 bg-stance-against"
                style={{ flexGrow: no }}
              />
            </div>
          )}
        </div>

        {/* 議案ごとの投票記録 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-mirai-text">
            議案ごとの投票（新しい順）
          </h2>
          {records.map(({ bill, vote, faction }) => (
            <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
              <Card className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.6]">
                    {bill.bill_content?.title || bill.name}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VOTE_CHIP_CLASS[vote]}`}
                  >
                    {VOTE_ARIA_LABEL[vote]}
                    <span aria-hidden="true">{VOTE_LABEL[vote]}</span>
                  </span>
                </div>
                <p className="text-xs text-mirai-text-muted">
                  {bill.submitted_date &&
                    `${formatDateWithDots(bill.submitted_date)} 議決・`}
                  {faction}
                </p>
              </Card>
            </Link>
          ))}
        </section>

        <div className="mt-10 rounded-md bg-white px-4 py-4 text-xs leading-[1.8] text-mirai-text-note">
          <p>
            ※田川市議会が公開している「賛否が分かれた案件」の議員別賛否のみを掲載しています。全会一致で議決された議案は含まれません。
          </p>
          <p>
            ※「採決に加わらず」は議長職務・除斥などにより採決に参加していないことを表します。
          </p>
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            {
              label: "議員・提出者から見る",
              href: routes.memberArchive(),
            },
            { label: `${summary.name} 議員` },
          ]}
        />
      </Container>
    </div>
  );
}
