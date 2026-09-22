import type {
  PetitionRecord,
  PetitionStatus,
} from "@mirai-gikai/shared/council/types";
import { FileText } from "lucide-react";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/text-link";
import { committeeSectionHref } from "@/features/committees/shared/utils/committee-groups";
import { resolveMemberPageKey } from "@/features/general-questions/shared/utils/question-links";
import { MemberLink } from "@/features/members/server/components/member-link";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  formatPetitionOutcome,
  PETITION_KIND_LABEL,
  PETITION_STATUS_LABEL,
} from "../../shared/utils/petition-display";
import type { PetitionLinkContext } from "../loaders/get-petitions";

/** 結果の種類ごとのバッジ色（採択は強調、否決・終了は控えめ、審査中は薄い青） */
const STATUS_CHIP_CLASS: Record<PetitionStatus, string> = {
  adopted: "bg-mirai-surface-key text-primary-accent",
  partial: "bg-mirai-surface-key text-primary-accent",
  rejected: "bg-mirai-surface-muted text-mirai-text-secondary",
  withdrawn: "bg-mirai-surface-muted text-mirai-text-secondary",
  expired: "bg-mirai-surface-muted text-mirai-text-secondary",
  continued: "bg-mirai-surface-key-subtle text-mirai-text",
  pending: "bg-mirai-surface-key-subtle text-mirai-text",
};

interface PetitionCardProps {
  record: PetitionRecord;
  context: PetitionLinkContext;
  /** 会期まとめページ向けの小さめ表示 */
  compact?: boolean;
}

/**
 * 請願・陳情1件のカード。
 * 種別と結果をバッジで示し、上程日・付託先・結果・紹介議員・原文PDFを並べる
 */
export function PetitionCard({
  record,
  context,
  compact = false,
}: PetitionCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-mirai-border bg-white",
        compact ? "p-3.5" : "p-4 md:p-5"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={record.kind === "seigan" ? "default" : "muted"}>
          {PETITION_KIND_LABEL[record.kind]}
        </Badge>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold",
            STATUS_CHIP_CLASS[record.status]
          )}
        >
          {PETITION_STATUS_LABEL[record.status]}
        </span>
        <span className="text-xs text-mirai-text-muted">
          {formatDateWithDots(record.submittedDate)} 上程
        </span>
      </div>

      <h3 className="text-[15px] font-bold leading-[1.6] text-mirai-text">
        {record.title}
      </h3>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs leading-[1.7] text-mirai-text-secondary">
        <dt className="font-medium text-mirai-text-muted">付託先</dt>
        <dd className="flex flex-wrap gap-x-2">
          {record.committees.length === 0
            ? "—"
            : record.committees.map((committee) =>
                context.committeeNames.has(committee) ? (
                  <TextLink
                    key={committee}
                    href={committeeSectionHref(committee) as Route}
                  >
                    {committee}
                  </TextLink>
                ) : (
                  <span key={committee}>{committee}</span>
                )
              )}
        </dd>
        <dt className="font-medium text-mirai-text-muted">結果</dt>
        <dd>
          {formatPetitionOutcome(record)}
          {record.decidedDate &&
            `（${formatDateWithDots(record.decidedDate)}）`}
        </dd>
        {record.introducers.length > 0 && (
          <>
            <dt className="font-medium text-mirai-text-muted">紹介議員</dt>
            <dd className="flex flex-wrap gap-x-2 gap-y-0.5">
              {record.introducers.map((person, index) => {
                const label =
                  index === 0 && record.introducers.length > 1
                    ? `${person.name}（代表）`
                    : person.name;
                return (
                  <MemberLink
                    key={`${index}-${person.name}`}
                    memberKey={resolveMemberPageKey(person, context)}
                  >
                    {label}
                  </MemberLink>
                );
              })}
            </dd>
          </>
        )}
      </dl>

      {record.documentUrl && !compact && (
        <TextLink external href={record.documentUrl} className="text-xs">
          <FileText aria-hidden className="size-3.5" />
          {PETITION_KIND_LABEL[record.kind]}文（PDF）を読む
        </TextLink>
      )}
    </article>
  );
}
