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
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import type { PetitionNote } from "../../shared/data/petition-notes";
import {
  formatPetitionOutcome,
  PETITION_KIND_LABEL,
  PETITION_STATUS_LABEL,
} from "../../shared/utils/petition-display";
import type { PetitionMeetingMatch } from "../../shared/utils/petition-meetings";
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
  /** 原文から書き起こした要望の内容と理由（原文が公開されているものだけ） */
  note?: PetitionNote;
  /** 審査した会議（委員会の記録との照合結果、古い順） */
  meetings?: readonly PetitionMeetingMatch[];
  /** 会期まとめページ向けの小さめ表示（内容・理由・経緯は載せない） */
  compact?: boolean;
}

/**
 * 請願・陳情1件のカード。
 * 種別と結果をバッジで示し、上程日・付託先・結果・紹介議員・原文PDFを並べる。
 * 原文があるものは「要望の内容」と「提出者が挙げる理由」を、委員会の記録があるものは
 * 「審査の経緯」（会議へのリンクと、その会議の要点のうち関係する行）を添える
 */
export function PetitionCard({
  record,
  context,
  note,
  meetings = [],
  compact = false,
}: PetitionCardProps) {
  const showNote = !compact && note && (note.gist || note.reasons?.length);
  // 理由が会議録にあるときは常に出す。無いときは「なぜ不採択か」を知りたい不採択・一部採択だけ、
  // 記載が無いことを示す（採択には出さない）
  const showDecision =
    note?.decision !== undefined &&
    (note.decision.report !== null ||
      record.status === "rejected" ||
      record.status === "partial");
  return (
    <article
      id={record.id}
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

      {showNote && (
        <div className="flex flex-col gap-2.5 rounded-md bg-mirai-surface-key-subtle px-3.5 py-3 text-xs leading-[1.7] text-mirai-text">
          {note.gist && (
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-mirai-text-muted">要望の内容</p>
              <p>{note.gist}</p>
            </div>
          )}
          {note.reasons && note.reasons.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-mirai-text-muted">
                提出者が挙げる理由
              </p>
              <ul className="list-disc pl-4">
                {note.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!compact && note?.decision && showDecision && (
        <div className="flex flex-col gap-1.5 text-xs leading-[1.7] text-mirai-text">
          <p className="font-bold text-mirai-text-muted">
            審査の結果と理由（本会議の会議録から）
          </p>
          {note.decision.report ? (
            <p>
              {note.decision.report}
              {note.decision.voteNote && (
                <span className="ml-1 font-bold">
                  → {note.decision.voteNote}
                </span>
              )}
            </p>
          ) : (
            <p className="text-mirai-text-secondary">
              {formatDateWithDots(note.decision.minutesDate)}
              の本会議では委員長の報告が省略され、結果だけが決まりました（閉会中の委員会で結論が出たため）。
              理由は本会議の会議録には載っていません。
            </p>
          )}
        </div>
      )}

      {!compact && note?.councilOpinion && (
        <p className="text-xs leading-[1.7] text-mirai-text-secondary">
          <span className="font-bold text-mirai-text-muted">
            採択にあたり議会が付した意見:{" "}
          </span>
          {note.councilOpinion}
        </p>
      )}

      {!compact && meetings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-mirai-text-muted">
            審査の経緯（委員会の記録から）
          </p>
          <ol className="flex flex-col gap-1.5 text-xs leading-[1.7] text-mirai-text-secondary">
            {meetings.map((meeting) => (
              <li key={meeting.meetingId} className="flex flex-col gap-0.5">
                <span className="flex flex-wrap gap-x-2">
                  <TextLink
                    href={routes.committeeMeeting(meeting.meetingId) as Route}
                  >
                    {formatDateWithDots(meeting.meetingDate)}{" "}
                    {meeting.committeeName}
                  </TextLink>
                  {meeting.headline && (
                    <span className="text-mirai-text-muted">
                      {meeting.headline}
                    </span>
                  )}
                </span>
                {meeting.notes.length > 0 && (
                  <ul className="list-disc pl-4">
                    {meeting.notes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {record.documentUrl && !compact && (
        <TextLink external href={record.documentUrl} className="text-xs">
          <FileText aria-hidden className="size-3.5" />
          {PETITION_KIND_LABEL[record.kind]}文（PDF）を読む
        </TextLink>
      )}
    </article>
  );
}
