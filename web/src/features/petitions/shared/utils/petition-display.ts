import type {
  PetitionKind,
  PetitionRecord,
  PetitionStatus,
} from "@mirai-gikai/shared/council/types";

export const PETITION_KIND_LABEL: Record<PetitionKind, string> = {
  seigan: "請願",
  chinjo: "陳情",
};

export const PETITION_STATUS_LABEL: Record<PetitionStatus, string> = {
  adopted: "採択",
  rejected: "不採択",
  partial: "一部採択",
  withdrawn: "取り下げ",
  expired: "審議未了",
  continued: "継続審査",
  pending: "審査中",
};

/** まだ結論が出ていない（審査中・継続審査） */
export function isPetitionOpen(
  record: Pick<PetitionRecord, "status">
): boolean {
  return record.status === "pending" || record.status === "continued";
}

export interface PetitionSummary {
  total: number;
  seigan: number;
  chinjo: number;
  open: number;
  adopted: number;
}

/** 一覧ページの見出しに出す件数 */
export function summarizePetitions(
  records: readonly PetitionRecord[]
): PetitionSummary {
  return {
    total: records.length,
    seigan: records.filter((r) => r.kind === "seigan").length,
    chinjo: records.filter((r) => r.kind === "chinjo").length,
    open: records.filter(isPetitionOpen).length,
    adopted: records.filter(
      (r) => r.status === "adopted" || r.status === "partial"
    ).length,
  };
}

/**
 * 審査中のものを先頭に、残りを上程日の新しい順に並べる。
 * 元の配列は変更しない
 */
export function splitPetitionsByOpen(records: readonly PetitionRecord[]): {
  open: PetitionRecord[];
  closed: PetitionRecord[];
} {
  const byDateDesc = (a: PetitionRecord, b: PetitionRecord) =>
    b.submittedDate.localeCompare(a.submittedDate);
  return {
    open: records.filter(isPetitionOpen).sort(byDateDesc),
    closed: records.filter((r) => !isPetitionOpen(r)).sort(byDateDesc),
  };
}

/**
 * 会期の期間中に上程されたか結果が出た請願・陳情（会期まとめページ用）
 */
export function selectPetitionsForSession(
  records: readonly PetitionRecord[],
  session: { start_date: string; end_date: string }
): PetitionRecord[] {
  const within = (date: string | null) =>
    date !== null && date >= session.start_date && date <= session.end_date;
  return records
    .filter((r) => within(r.submittedDate) || within(r.decidedDate))
    .sort((a, b) => b.submittedDate.localeCompare(a.submittedDate));
}

/** 「採択（執行部送付）」のように結果と措置をひとつの文にする */
export function formatPetitionOutcome(
  record: Pick<PetitionRecord, "status" | "result" | "measure">
): string {
  const base = record.result ?? PETITION_STATUS_LABEL[record.status];
  return record.measure ? `${base}（${record.measure}）` : base;
}
