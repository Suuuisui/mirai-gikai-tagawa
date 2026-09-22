import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import {
  countQuestionItems,
  formatQuestionPeriod,
  type QuestionSessionGroup,
} from "../../shared/utils/group-questions";
import type { QuestionLinkContext } from "../loaders/get-general-questions";
import { QuestionDaySections } from "./question-day-sections";
import { QuestionIntro, QuestionSourceNote } from "./question-intro";

interface GeneralQuestionSessionPageProps {
  group: QuestionSessionGroup;
  /** ひとつ前（古い）会期 */
  older: QuestionSessionGroup | null;
  /** ひとつ後（新しい）会期 */
  newer: QuestionSessionGroup | null;
  context: QuestionLinkContext;
}

/** 定例会1回分の一般質問ページ（/questions/[sessionKey]） */
export function GeneralQuestionSessionPage({
  group,
  older,
  newer,
  context,
}: GeneralQuestionSessionPageProps) {
  const sessionId = context.sessionIdByKey.get(group.sessionKey);

  return (
    <div data-wide-column>
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <p className="text-xs font-bold text-primary-accent">一般質問</p>
          <h1 className="mt-1 text-2xl font-bold leading-[1.4] text-mirai-text">
            {group.sessionName}の一般質問
          </h1>
          <p className="mt-2 text-sm font-medium text-mirai-text-muted">
            {formatQuestionPeriod(group)}・{group.records.length}人・
            {countQuestionItems(group.records)}項目
          </p>
          <div className="mt-3">
            <QuestionIntro />
          </div>
          {sessionId && (
            <div className="mt-4">
              <TextLink href={routes.sessionSummary(sessionId) as Route}>
                この会期の議案と議決結果のまとめ
              </TextLink>
            </div>
          )}
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-10">
          <QuestionDaySections
            days={group.days}
            context={context}
            headingLevel="h2"
          />

          <nav
            aria-label="前後の定例会"
            className="flex flex-col gap-2 sm:flex-row sm:justify-between"
          >
            {older ? (
              <TextLink
                href={routes.questionSession(older.sessionKey) as Route}
                className="text-sm"
              >
                <ChevronLeft aria-hidden className="size-4" />
                {older.sessionName}
              </TextLink>
            ) : (
              <span />
            )}
            {newer && (
              <TextLink
                href={routes.questionSession(newer.sessionKey) as Route}
                className="text-sm sm:ml-auto"
              >
                {newer.sessionName}
                <ChevronRight aria-hidden className="size-4" />
              </TextLink>
            )}
          </nav>

          <QuestionSourceNote />
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "一般質問", href: routes.questions() },
            { label: group.sessionName },
          ]}
        />
      </Container>
    </div>
  );
}
