import type {
  MemberVotes,
  MemberVoteValue,
} from "@/features/bills/shared/utils/member-votes";

/** 集計対象の議案が最低限持つべきフィールド */
interface BillLike {
  id: string;
  submitted_date: string | null;
}

/** 議員別賛否データ（member_votes）が紐づく議案 */
export interface BillWithMemberVotes<TBill extends BillLike = BillLike> {
  bill: TBill;
  memberVotes: MemberVotes;
}

/** 議員1名の集計サマリー */
export interface MemberSummary {
  name: string;
  /** 所属会派（新しい議案での所属が先頭。会派移動があった場合は複数） */
  factions: string[];
  /** 直近の議案での所属会派 */
  latestFaction: string;
  counts: Record<MemberVoteValue, number>;
  /** 賛否データに登場した議案数 */
  billCount: number;
}

/** 議員個人ページ用: 1議案分の投票記録 */
export interface MemberVoteRecord<TBill extends BillLike = BillLike> {
  bill: TBill;
  vote: MemberVoteValue;
  /** その議案の採決時点での所属会派 */
  faction: string;
}

/** 議決日の新しい順（null末尾）にソートした配列を返す。元配列は変更しない */
function sortByDateDesc<T extends BillLike>(
  items: BillWithMemberVotes<T>[]
): BillWithMemberVotes<T>[] {
  return [...items].sort((a, b) => {
    const dateA = a.bill.submitted_date;
    const dateB = b.bill.submitted_date;
    if (dateA === dateB) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
    return dateA < dateB ? 1 : -1;
  });
}

const EMPTY_COUNTS: Record<MemberVoteValue, number> = {
  yes: 0,
  no: 0,
  absent: 0,
  not_voting: 0,
};

/**
 * 全議案の議員別賛否データから、議員ごとのサマリー一覧を作る。
 * 名前（姓）が同じ議員は同一人物として集計する。
 * 会派は新しい議案での所属を先頭に、重複なく記録する。
 * 戻り値の並び順は、新しい議案の賛否表での登場順（出典画像の会派内掲載順）。
 * 漢字名はlocaleCompareでも五十音順に並ばないため、出典の掲載順を尊重する
 */
export function aggregateMemberSummaries(
  items: BillWithMemberVotes[]
): MemberSummary[] {
  const byName = new Map<string, MemberSummary>();

  for (const { memberVotes } of sortByDateDesc(items)) {
    for (const entry of memberVotes.entries) {
      let summary = byName.get(entry.name);
      if (!summary) {
        summary = {
          name: entry.name,
          factions: [],
          latestFaction: entry.faction,
          counts: { ...EMPTY_COUNTS },
          billCount: 0,
        };
        byName.set(entry.name, summary);
      }
      if (!summary.factions.includes(entry.faction)) {
        summary.factions.push(entry.faction);
      }
      summary.counts[entry.vote] += 1;
      summary.billCount += 1;
    }
  }

  return [...byName.values()];
}

/**
 * 指定した議員（姓）の投票記録を、議決日の新しい順に返す。
 * 該当議員が登場しない議案は含まれない
 */
export function collectMemberVoteRecords<T extends BillLike>(
  items: BillWithMemberVotes<T>[],
  name: string
): MemberVoteRecord<T>[] {
  const records: MemberVoteRecord<T>[] = [];
  for (const { bill, memberVotes } of sortByDateDesc(items)) {
    const entry = memberVotes.entries.find((e) => e.name === name);
    if (entry) {
      records.push({ bill, vote: entry.vote, faction: entry.faction });
    }
  }
  return records;
}
