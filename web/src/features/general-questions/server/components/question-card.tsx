import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";
import { FileText, MessageSquareText, Youtube } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { TextLink } from "@/components/ui/text-link";
import { MemberLink } from "@/features/members/server/components/member-link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { questionAnchorId } from "../../shared/utils/group-questions";
import {
  alignOutlineWithItems,
  resolveMemberPageKey,
} from "../../shared/utils/question-links";
import type { QuestionLinkContext } from "../loaders/get-general-questions";
import { OutlinePoints } from "./outline-points";

interface QuestionCardProps {
  record: GeneralQuestionRecord;
  context: QuestionLinkContext;
  /** 見出しの階層（一覧ページでは h4、会期ページでは h3） */
  headingLevel: "h3" | "h4";
  /** 会期まとめ・議員ページ向けの小さめ表示（要旨・PDFは省略） */
  compact?: boolean;
  /** 議員名の代わりに会期名を見出しにし、会期ページの該当箇所へリンクする（議員ページ用） */
  headingBySession?: boolean;
}

/**
 * 議員1人の一般質問（通告）カード。
 * 質問事項を番号付きで並べ、通告書PDFの要旨があれば項目ごとに示す。
 * 録画・その日の本会議の記録・通告書PDFへの導線を下に置く
 */
export function QuestionCard({
  record,
  context,
  headingLevel,
  compact = false,
  headingBySession = false,
}: QuestionCardProps) {
  const Heading = headingLevel;
  const memberKey = resolveMemberPageKey(
    { familyName: record.familyName, name: record.memberName },
    context
  );
  const answerRecordId = record.questionDate
    ? context.answerRecordIdByDate.get(record.questionDate)
    : undefined;
  const alignedOutline = compact ? null : alignOutlineWithItems(record);
  const unalignedOutline =
    !compact && !alignedOutline && record.outline ? record.outline : null;
  const unalignedPointCount =
    unalignedOutline?.reduce((sum, item) => sum + item.points.length, 0) ?? 0;

  return (
    <article
      id={headingBySession ? undefined : questionAnchorId(record)}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-mirai-border bg-white",
        compact ? "p-3.5" : "p-4 md:p-5",
        !headingBySession && jumpTargetClassName
      )}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {!headingBySession && (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-mirai-surface-key text-xs font-bold text-primary-accent">
            {record.order}
            <span className="sr-only">番目</span>
          </span>
        )}
        <Heading className="text-base font-bold leading-[1.5] text-mirai-text">
          {headingBySession ? (
            <Link
              href={
                `${routes.questionSession(record.sessionKey)}#${questionAnchorId(record)}` as Route
              }
              className="hover:underline"
            >
              {record.sessionName}
            </Link>
          ) : (
            <MemberLink memberKey={memberKey} className="text-mirai-text">
              {record.memberName} 議員
            </MemberLink>
          )}
        </Heading>
        {record.isRepresentative && record.faction && (
          <Badge variant="muted">代表質問（{record.faction}）</Badge>
        )}
        {record.format && !compact && (
          <span className="text-xs text-mirai-text-muted">{record.format}</span>
        )}
      </header>

      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-[1.7] text-mirai-text">
        {record.items.map((item, index) => {
          const outlineItem = alignedOutline?.[index];
          return (
            <li key={`${index}-${item}`}>
              <span className="font-medium">{item}</span>
              {outlineItem && outlineItem.points.length > 0 && (
                <div className="mt-1">
                  <OutlinePoints points={outlineItem.points} muted />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* 要旨の区切りが公式ページの項目と合わないときは、PDFの並びのまま別枠で示す */}
      {unalignedOutline && unalignedPointCount > 0 && (
        <details className="rounded-md bg-mirai-surface px-3 py-2 text-[13px] text-mirai-text-secondary">
          <summary className="cursor-pointer font-medium text-mirai-text">
            通告書に書かれた要旨（{unalignedPointCount}点）
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {unalignedOutline.map((item, index) => (
              <li key={`${index}-${item.title}`}>
                {item.title && (
                  <p className="font-medium text-mirai-text">{item.title}</p>
                )}
                <OutlinePoints points={item.points} />
              </li>
            ))}
          </ul>
        </details>
      )}

      {(record.videoUrl || answerRecordId || record.pdfUrl) && (
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {record.videoUrl && (
            <TextLink external href={record.videoUrl}>
              <Youtube aria-hidden className="size-3.5" />
              録画を見る
            </TextLink>
          )}
          {answerRecordId && (
            <TextLink href={routes.committeeMeeting(answerRecordId) as Route}>
              <MessageSquareText aria-hidden className="size-3.5" />
              この日の本会議の記録（答弁の要約）
            </TextLink>
          )}
          {record.pdfUrl && !compact && (
            <TextLink external href={record.pdfUrl}>
              <FileText aria-hidden className="size-3.5" />
              通告書（PDF）
            </TextLink>
          )}
        </footer>
      )}
    </article>
  );
}
