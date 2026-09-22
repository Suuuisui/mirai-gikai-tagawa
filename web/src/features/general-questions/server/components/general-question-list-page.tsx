import { CalendarDays, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShowMoreList } from "@/components/ui/show-more-list";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import {
  formatQuestionPeriod,
  type QuestionSessionGroup,
} from "../../shared/utils/group-questions";
import type { QuestionLinkContext } from "../loaders/get-general-questions";
import { QuestionDaySections } from "./question-day-sections";
import { QuestionIntro, QuestionSourceNote } from "./question-intro";

interface GeneralQuestionListPageProps {
  groups: readonly QuestionSessionGroup[];
  context: QuestionLinkContext;
}

/** 一覧の先頭に全文で載せる会期数（残りは会期ページへ） */
const FULL_SESSION_COUNT = 1;
const PAST_SESSIONS_INITIAL = 8;

/**
 * 一般質問の一覧ページ（/questions）。
 * いちばん新しい定例会の質問を全文で載せ、それ以前の定例会は
 * 会期名・期間・人数の一覧から会期ページへ送る
 */
export function GeneralQuestionListPage({
  groups,
  context,
}: GeneralQuestionListPageProps) {
  const latest = groups.slice(0, FULL_SESSION_COUNT);
  const past = groups.slice(FULL_SESSION_COUNT);
  const totalRecords = groups.reduce((sum, g) => sum + g.records.length, 0);
  const videoCount = groups.reduce(
    (sum, g) => sum + g.records.filter((r) => r.videoUrl).length,
    0
  );

  return (
    <div data-wide-column>
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">
            一般質問（議員が市に問うこと）
          </h1>
          <div className="mt-2">
            <QuestionIntro />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              {groups.length}回の定例会
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              <Users aria-hidden className="size-3.5" />
              のべ{totalRecords}人の質問
            </span>
            <span className="rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              録画あり {videoCount}人分
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {groups.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            一般質問の記録はまだありません
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {latest.map((group) => {
              const sessionId = context.sessionIdByKey.get(group.sessionKey);
              return (
                <section key={group.sessionKey} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <SectionHeading>
                      最新: {group.sessionName}の一般質問
                    </SectionHeading>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-mirai-text-muted">
                      <span>
                        {formatQuestionPeriod(group)}・{group.records.length}人
                      </span>
                      {sessionId && (
                        <TextLink
                          href={routes.sessionSummary(sessionId) as Route}
                        >
                          この会期のまとめ
                        </TextLink>
                      )}
                    </p>
                  </div>
                  <QuestionDaySections
                    days={group.days}
                    context={context}
                    headingLevel="h3"
                  />
                </section>
              );
            })}

            {past.length > 0 && (
              <section className="flex flex-col gap-4">
                <SectionHeading>これまでの定例会の一般質問</SectionHeading>
                <ShowMoreList
                  initialCount={PAST_SESSIONS_INITIAL}
                  className="flex flex-col gap-2"
                >
                  {past.map((group) => (
                    <PastSessionRow key={group.sessionKey} group={group} />
                  ))}
                </ShowMoreList>
              </section>
            )}

            <QuestionSourceNote />
          </div>
        )}
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[{ label: "TOP", href: routes.home() }, { label: "一般質問" }]}
        />
      </Container>
    </div>
  );
}

function PastSessionRow({ group }: { group: QuestionSessionGroup }) {
  const members = group.records.map((record) => record.familyName);
  const memberLabel =
    members.length > 5
      ? `${members.slice(0, 5).join("・")} ほか${members.length - 5}人`
      : members.join("・");
  return (
    <Link
      href={routes.questionSession(group.sessionKey) as Route}
      className="flex flex-col gap-1 rounded-lg border border-mirai-border bg-white px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[15px] font-bold text-mirai-text">
          {group.sessionName}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-mirai-text-muted">
          <CalendarDays aria-hidden className="size-3.5" />
          {formatQuestionPeriod(group)}・{group.records.length}人
        </span>
      </span>
      <span className="text-xs text-mirai-text-secondary">{memberLabel}</span>
    </Link>
  );
}
