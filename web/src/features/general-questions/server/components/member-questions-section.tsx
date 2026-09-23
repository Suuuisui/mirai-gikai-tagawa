import { ShowMoreList } from "@/components/ui/show-more-list";
import { selectQuestionsByMember } from "../../shared/utils/group-questions";
import {
  getAllGeneralQuestions,
  getQuestionLinkContext,
} from "../loaders/get-general-questions";
import { QuestionCard } from "./question-card";

interface MemberQuestionsSectionProps {
  /** 議員の姓（議員ページのキー） */
  familyName: string;
  /** 公式名簿のフルネーム（同姓の別人の質問を混ぜないため。名簿に無ければ null） */
  fullName: string | null;
}

/** 議員個人ページに載せる「一般質問で取り上げたこと」（新しい順） */
export async function MemberQuestionsSection({
  familyName,
  fullName,
}: MemberQuestionsSectionProps) {
  const records = selectQuestionsByMember(getAllGeneralQuestions(), {
    familyName,
    fullName,
  });
  if (records.length === 0) return null;
  const context = await getQuestionLinkContext();

  return (
    <section className="mb-8 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-mirai-text">
        一般質問で取り上げたこと
        <span className="ml-2 text-sm font-medium text-mirai-text-muted">
          {records.length}回
        </span>
      </h2>
      <ShowMoreList initialCount={5} className="flex flex-col gap-3">
        {records.map((record) => (
          <QuestionCard
            key={record.id}
            record={record}
            context={context}
            headingLevel="h3"
            compact
            headingBySession
          />
        ))}
      </ShowMoreList>
    </section>
  );
}
