import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { ShowMoreList } from "@/components/ui/show-more-list";
import {
  VOTE_ARIA_LABEL,
  VOTE_CHIP_CLASS,
  VOTE_LABEL,
} from "@/features/bills/shared/utils/member-vote-display";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { ROSTER_AS_OF } from "../../shared/data/member-profiles";
import {
  aggregateMemberSummaries,
  collectMemberVoteRecords,
} from "../../shared/utils/aggregate-members";
import {
  resolveMemberDisplayName,
  resolveMemberProfile,
} from "../../shared/utils/resolve-member-display";
import {
  collectSponsorNames,
  extractFamilyName,
} from "../../shared/utils/sponsors";
import {
  getBillsWithMemberVotes,
  getBillsWithSponsors,
} from "../loaders/get-member-vote-data";

interface MemberDetailPageProps {
  /** 議員名（姓、デコード済み） */
  name: string;
}

// 提出者・賛成者チップの共通スタイル（vote チップと視覚的に区別するため
// bg-mirai-surface-muted の単色トーンにしている）
const SPONSOR_CHIP_CLASS =
  "inline-flex shrink-0 items-center gap-1 rounded-full bg-mirai-surface-muted px-2.5 py-1 text-xs font-medium text-mirai-text-secondary";

/**
 * 議員個人ページ
 *
 * 賛否が分かれた案件での、この議員の投票記録（賛成・反対・欠席・
 * 採決に加わらず）と、議案説明資料PDFから分かる提出・連署の記録を
 * 議決日の新しい順に一覧表示する
 */
export async function MemberDetailPage({ name }: MemberDetailPageProps) {
  const [items, sponsoredBills] = await Promise.all([
    getBillsWithMemberVotes(),
    getBillsWithSponsors(),
  ]);
  const summary = aggregateMemberSummaries(items).find(
    (member) => member.name === name
  );

  if (!summary) {
    notFound();
  }

  const records = collectMemberVoteRecords(items, name);
  const { yes, no, absent, not_voting } = summary.counts;

  const proposedBills = sponsoredBills.filter(({ sponsors }) =>
    sponsors.proposers.some((person) => extractFamilyName(person.name) === name)
  );
  const supportedBills = sponsoredBills.filter(({ sponsors }) =>
    sponsors.supporters.some(
      (person) => extractFamilyName(person.name) === name
    )
  );

  // 表示名はMEMBER_PROFILES（公式名簿）を優先し、無ければsponsorsデータ中で
  // この議員の姓と一致するフルネームがちょうど1つだけ見つかった場合それを使う
  // （どちらも無ければ姓のみ表示）
  const allSponsorNames = collectSponsorNames(
    sponsoredBills.map(({ sponsors }) => sponsors)
  );
  const displayName = resolveMemberDisplayName(name, allSponsorNames);
  const profile = resolveMemberProfile(name);

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-1.5 pb-6">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            {displayName} 議員
          </h1>
          {profile?.reading && (
            <p className="text-xs text-mirai-text-muted">{profile.reading}</p>
          )}
          <p className="text-xs text-mirai-text-secondary">
            会派: {summary.factions.join(" / ")}
            {summary.factions.length > 1 && "（新しい順）"}
            {profile?.role && `・${profile.role}`}
            {profile?.electedCount !== undefined &&
              `・当選${profile.electedCount}回`}
          </p>
          {profile && !profile.isIncumbent && (
            <p className="text-xs text-mirai-text-muted">
              元議員
              {profile.note && `（${profile.note}）`}
            </p>
          )}
          {profile && (
            <p className="text-xs text-mirai-text-note">
              ※氏名・役職・当選回数は公式議員名簿（{ROSTER_AS_OF}時点）より
            </p>
          )}
        </div>

        {/* 集計サマリー */}
        <div className="mb-6 rounded-md bg-white px-4 py-5">
          <p className="text-xs text-mirai-text-secondary">
            賛成{yes}・反対{no}
            {absent > 0 && `・欠席${absent}`}
            {not_voting > 0 && `・採決に加わらず${not_voting}`}
            <span className="ml-1 font-medium text-mirai-text-muted">
              （{summary.billCount}議案）
            </span>
          </p>
          <p className="mt-2 text-xs text-mirai-text-note">
            ※賛成・反対の数は議員の評価を示すものではありません。個々の議案の内容とあわせてご覧ください。
          </p>
        </div>

        {/* 提出した議案（議案説明資料PDFに提出者として記載がある議案のみ） */}
        {proposedBills.length > 0 && (
          <section className="mb-8 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-mirai-text">提出した議案</h2>
            {proposedBills.map(({ bill }) => (
              <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
                <Card className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.6]">
                      {bill.bill_content?.title || bill.name}
                    </h3>
                    <span className={SPONSOR_CHIP_CLASS}>提出者</span>
                  </div>
                  <p className="text-xs text-mirai-text-muted">
                    {bill.submitted_date &&
                      `${formatDateWithDots(bill.submitted_date)} 議決`}
                  </p>
                </Card>
              </Link>
            ))}
          </section>
        )}

        {/* 賛成者として連署した議案（議案説明資料PDFに賛成者として記載がある議案のみ） */}
        {supportedBills.length > 0 && (
          <section className="mb-8 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-mirai-text">
              賛成者として連署した議案
            </h2>
            <ShowMoreList initialCount={5} className="flex flex-col gap-3">
              {supportedBills.map(({ bill }) => (
                <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
                  <Card className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.6]">
                        {bill.bill_content?.title || bill.name}
                      </h3>
                      <span className={SPONSOR_CHIP_CLASS}>賛成者</span>
                    </div>
                    <p className="text-xs text-mirai-text-muted">
                      {bill.submitted_date &&
                        `${formatDateWithDots(bill.submitted_date)} 議決`}
                    </p>
                  </Card>
                </Link>
              ))}
            </ShowMoreList>
          </section>
        )}

        {/* 議案ごとの投票記録 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-mirai-text">
            議案ごとの投票（新しい順）
          </h2>
          <ShowMoreList
            initialCount={10}
            step={50}
            className="flex flex-col gap-3"
          >
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
          </ShowMoreList>
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
