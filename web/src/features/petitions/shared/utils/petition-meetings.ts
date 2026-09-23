import type { PetitionRecord } from "@mirai-gikai/shared/council/types";
import type { CommitteeMeetingPetitionRef } from "@/features/committees/shared/types";
import { isPetitionOpen, PETITION_KIND_LABEL } from "./petition-display";

/** 請願・陳情を審査した（言及した）会議と、その会議の要点のうち関係する行 */
export interface PetitionMeetingMatch {
  meetingId: string;
  committeeName: string;
  meetingDate: string;
  headline: string | null;
  /** その請願・陳情に触れている要点（審査の結果や理由）。無い会議は空 */
  notes: string[];
}

/** 上程日より前・結果が出た日より後にどれだけ離れた会議まで照合するか */
const DATE_SLACK_DAYS = 7;

function normalize(text: string): string {
  return text.normalize("NFKC").replace(/[\s「」『』（）()]/g, "");
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 件名の識別に使う語。「〜に関する陳情」「〜を求める請願」のような定型を除いた
 * 先頭8字（「田川市高等教育の支援拡充に関する陳情」→「田川市高等教育の」）
 */
export function petitionKeyword(title: string): string {
  const core = normalize(title).replace(
    /(に関する|を求める|の採択を求める|についての|に係る)?(請願|陳情)(について)?$/,
    ""
  );
  return core.slice(0, 8);
}

/** 「陳情第2号」のような番号の語（会議の中では番号だけで呼ばれることが多い） */
function petitionNumberLabel(
  record: Pick<PetitionRecord, "kind" | "number">
): string {
  return `${PETITION_KIND_LABEL[record.kind]}第${record.number}号`;
}

/**
 * 会議の議題・要点の1行が、その請願・陳情に触れているか。
 * 件名そのもの、または「陳情第2号」のような番号＋件名の語、または
 * 件名の語＋「陳情／請願」の語で判定する（番号は年ごとに1から振り直されるので単独では使わない）
 */
export function lineMentionsPetition(
  line: string,
  record: Pick<PetitionRecord, "kind" | "number" | "title">
): boolean {
  const text = normalize(line);
  const title = normalize(record.title);
  const kindLabel = PETITION_KIND_LABEL[record.kind];
  const numberLabel = petitionNumberLabel(record);
  const keyword = petitionKeyword(record.title);
  if (title.length > 0 && text.includes(title)) return true;
  if (keyword.length < 4) return false;
  if (text.includes(numberLabel) && text.includes(keyword)) return true;
  return text.includes(keyword) && text.includes(kindLabel);
}

/**
 * 請願・陳情を審査した会議を、開催日の古い順に返す。
 * 上程日の少し前から、結果が出た日の少し後まで（審査中・継続審査は上限なし）の会議のうち、
 * 議題か要点で触れているものだけ
 */
export function matchPetitionMeetings(
  record: PetitionRecord,
  meetings: readonly CommitteeMeetingPetitionRef[]
): PetitionMeetingMatch[] {
  const from = shiftDate(record.submittedDate, -DATE_SLACK_DAYS);
  const to =
    isPetitionOpen(record) || record.decidedDate === null
      ? null
      : shiftDate(record.decidedDate, DATE_SLACK_DAYS);
  return meetings
    .filter(
      (meeting) =>
        meeting.meeting_date >= from &&
        (to === null || meeting.meeting_date <= to)
    )
    .flatMap((meeting) => {
      const mentioned = [...meeting.agenda_items, ...meeting.key_points].some(
        (line) => lineMentionsPetition(line, record)
      );
      if (!mentioned) return [];
      // その会議が審査したと分かっていれば、要点は番号だけの言及（「陳情第2号は継続審査」）でも拾う
      const numberLabel = petitionNumberLabel(record);
      return [
        {
          meetingId: meeting.id,
          committeeName: meeting.committee_name,
          meetingDate: meeting.meeting_date,
          headline: meeting.headline,
          notes: meeting.key_points.filter(
            (line) =>
              lineMentionsPetition(line, record) ||
              normalize(line).includes(numberLabel)
          ),
        },
      ];
    })
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
}
