import { TextLink } from "@/components/ui/text-link";
import { officialMinutesIndex } from "@/features/official-minutes/shared/data/official-minutes-index";
import {
  formatQuestionDayLabel,
  type QuestionDayGroup,
} from "../../shared/utils/group-questions";
import type { QuestionLinkContext } from "../loaders/get-general-questions";
import { QuestionCard } from "./question-card";

interface QuestionDaySectionsProps {
  days: QuestionDayGroup[];
  context: QuestionLinkContext;
  /** 日付見出しの階層（カードの見出しはその1つ下になる） */
  headingLevel: "h2" | "h3";
}

/**
 * 会期内の一般質問を「1日目（9月9日）」ごとに区切って並べる。
 * その日の本会議の会議録が公開されていれば、見出しの横から開けるようにする
 */
export function QuestionDaySections({
  days,
  context,
  headingLevel,
}: QuestionDaySectionsProps) {
  const DayHeading = headingLevel;
  const cardHeadingLevel = headingLevel === "h2" ? "h3" : "h4";
  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => {
        const minutes = day.date
          ? officialMinutesIndex.findByDate(day.date)
          : null;
        return (
          <section key={day.date ?? "unknown"} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DayHeading className="text-sm font-bold text-mirai-text-secondary">
                {formatQuestionDayLabel(day)}
                <span className="ml-2 font-medium text-mirai-text-muted">
                  {day.records.length}人
                </span>
              </DayHeading>
              {minutes && (
                <TextLink external href={minutes.url} className="text-xs">
                  <span className="sr-only">
                    {formatQuestionDayLabel(day)}の
                  </span>
                  公式の会議録（質問と答弁の全文）
                </TextLink>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {day.records.map((record) => (
                <QuestionCard
                  key={record.id}
                  record={record}
                  context={context}
                  headingLevel={cardHeadingLevel}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
