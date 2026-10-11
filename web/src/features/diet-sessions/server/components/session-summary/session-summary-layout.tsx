import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import type { BillWithContent } from "@/features/bills/shared/types";
import { SessionQuestionsSection } from "@/features/general-questions/server/components/session-questions-section";
import { officialMinutesIndex } from "@/features/official-minutes/shared/data/official-minutes-index";
import { SessionPetitionsSection } from "@/features/petitions/server/components/session-petitions-section";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { routes } from "@/lib/routes";
import { formatDate, formatDateWithDots } from "@/lib/utils/date";
import { BillListWithStatusFilter } from "../../../client/components/bill-list-with-status-filter";
import type { DietSession } from "../../../shared/types";
import {
  pickSessionHighlights,
  summarizeSessionResults,
} from "../../../shared/utils/session-summary";
import { getAdjacentSessions } from "../../loaders/get-adjacent-sessions";
import { SessionHighlightsSection } from "./session-highlights-section";
import { SessionNav } from "./session-nav";
import { SessionSummaryStats } from "./session-summary-stats";
import { SplitVoteSection } from "./split-vote-section";

const HIGHLIGHT_COUNT = 3;

interface SessionSummaryLayoutProps {
  session: DietSession;
  bills: BillWithContent[];
}

/**
 * 会期まとめページ（/sessions/[id]）本体。
 * 既存DBデータ（bills / bill_contents / member_votes / タグ）から
 * 数字・ハイライト・賛否割れ議案・全議案リスト・前後ナビを自動集計して表示する
 */
export async function SessionSummaryLayout({
  session,
  bills,
}: SessionSummaryLayoutProps) {
  const adjacent = await getAdjacentSessions(session.id);

  const summary = summarizeSessionResults(bills);
  const highlights = pickSessionHighlights(bills, HIGHLIGHT_COUNT);
  // この会期の本会議の会議録（会議録検索システムに公開されている日だけ）
  const minutes = officialMinutesIndex.findInRange(
    session.start_date.slice(0, 10),
    session.end_date.slice(0, 10)
  );

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-10">
          <Breadcrumb
            items={[
              { label: "TOP", href: routes.home() },
              { label: `${session.name}のまとめ` },
            ]}
          />

          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold leading-[1.4] text-mirai-text">
              {session.name}のまとめ
            </h1>
            <p className="text-sm font-medium text-mirai-text-muted">
              {formatDate(session.start_date)} 〜 {formatDate(session.end_date)}
            </p>
            {/* このページのもとになっている公式の資料（議決結果のページと、公開済みの会議録） */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <SourceBadge
                kind="official"
                detail="市議会の議案のページ"
                className="bg-white"
              />
              {session.shugiin_url && (
                <TextLink
                  external
                  href={session.shugiin_url}
                  className="text-xs"
                >
                  もとの資料
                </TextLink>
              )}
            </div>
            {minutes.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mirai-text-secondary">
                <span className="font-bold">本会議の会議録</span>
                {minutes.map((day) => (
                  <TextLink
                    key={day.url}
                    external
                    href={day.url}
                    className="text-xs"
                  >
                    {day.dayLabel}（{formatDateWithDots(day.date)}）
                  </TextLink>
                ))}
              </div>
            )}
          </header>

          <SessionSummaryStats summary={summary} />

          <SessionHighlightsSection bills={highlights} />

          <SplitVoteSection bills={bills} />

          {/* 一般質問・請願陳情は公式サイト由来の静的データ（該当が無ければ何も出さない） */}
          <SessionQuestionsSection sessionKey={session.slug} />
          <SessionPetitionsSection session={session} />

          <section className="flex flex-col gap-4">
            <SectionHeading>全議案リスト</SectionHeading>
            {bills.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                この会期の議案はまだありません
              </p>
            ) : (
              <BillListWithStatusFilter bills={bills} />
            )}
          </section>

          <SessionNav adjacent={adjacent} />
        </div>
      </Container>
    </div>
  );
}
