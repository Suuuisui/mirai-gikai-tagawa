import type { Route } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import { selectQuestionsForSession } from "../../shared/utils/group-questions";
import {
  getAllGeneralQuestions,
  getQuestionLinkContext,
} from "../loaders/get-general-questions";
import { QuestionCard } from "./question-card";

interface SessionQuestionsSectionProps {
  /** 会期のslug（diet_sessions.slug）。一般質問の会期キーと同じ形式 */
  sessionKey: string | null;
}

/**
 * 会期まとめページに載せる「この会期の一般質問」。
 * カードは質問事項と録画・記録への導線だけの簡易表示（要旨・PDFは会期ページで）
 */
export async function SessionQuestionsSection({
  sessionKey,
}: SessionQuestionsSectionProps) {
  if (!sessionKey) return null;
  const records = selectQuestionsForSession(
    getAllGeneralQuestions(),
    sessionKey
  );
  if (records.length === 0) return null;
  const context = await getQuestionLinkContext();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionHeading>この会期の一般質問</SectionHeading>
        <p className="text-xs font-medium text-mirai-text-muted">
          {records.length}人の議員が市政について質問しました
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {records.map((record) => (
          <QuestionCard
            key={record.id}
            record={record}
            context={context}
            headingLevel="h3"
            compact
          />
        ))}
      </div>
      <TextLink href={routes.questionSession(sessionKey) as Route}>
        質問の要旨・録画・答弁の記録を見る
      </TextLink>
    </section>
  );
}
