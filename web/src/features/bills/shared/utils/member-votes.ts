/** 議員1名分の賛否。yes=○賛成 / no=×反対 / absent=欠席 / not_voting=−（採決に加わらず） */
export type MemberVoteValue = "yes" | "no" | "absent" | "not_voting";

const MEMBER_VOTE_VALUES: readonly MemberVoteValue[] = [
  "yes",
  "no",
  "absent",
  "not_voting",
];

export interface MemberVoteEntry {
  /** 議員名（姓、出典画像の表記どおり） */
  name: string;
  /** 会派名 */
  faction: string;
  vote: MemberVoteValue;
}

/** bills.member_votes（jsonbカラム）の中身 */
export interface MemberVotes {
  /** 出典のPNG画像URL */
  imageUrl: string;
  /** 掲載元の議決結果ページURL */
  sourceUrl: string;
  /** 画像下部の注記（議長は採決に加わらない等） */
  notes?: string[];
  entries: MemberVoteEntry[];
}

function isMemberVoteValue(value: unknown): value is MemberVoteValue {
  return (
    typeof value === "string" &&
    (MEMBER_VOTE_VALUES as readonly string[]).includes(value)
  );
}

function isMemberVoteEntry(value: unknown): value is MemberVoteEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.name === "string" &&
    entry.name !== "" &&
    typeof entry.faction === "string" &&
    entry.faction !== "" &&
    isMemberVoteValue(entry.vote)
  );
}

/**
 * bills.member_votes（jsonbカラム）の値を検証してMemberVotesに変換する。
 * 想定形式でない値・entriesが空/不正な要素を含む場合はnullを返す
 * （議員別賛否データが無い議案、またはデータ不整合時にセクションを
 * 非表示にするため）
 */
export function parseMemberVotes(value: unknown): MemberVotes | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.imageUrl !== "string" ||
    candidate.imageUrl === "" ||
    typeof candidate.sourceUrl !== "string" ||
    candidate.sourceUrl === ""
  ) {
    return null;
  }

  if (!Array.isArray(candidate.entries) || candidate.entries.length === 0) {
    return null;
  }
  if (!candidate.entries.every(isMemberVoteEntry)) {
    return null;
  }

  let notes: string[] | undefined;
  if (candidate.notes !== undefined) {
    if (
      !Array.isArray(candidate.notes) ||
      !candidate.notes.every((note) => typeof note === "string")
    ) {
      return null;
    }
    notes = candidate.notes;
  }

  return {
    imageUrl: candidate.imageUrl,
    sourceUrl: candidate.sourceUrl,
    ...(notes !== undefined ? { notes } : {}),
    entries: candidate.entries as MemberVoteEntry[],
  };
}

export interface FactionGroup {
  faction: string;
  members: { name: string; vote: MemberVoteValue }[];
}

/**
 * 議員の賛否一覧を会派ごとにグループ化する。会派の出現順（entriesの並び順で
 * 最初に登場した順）を維持する
 */
export function groupEntriesByFaction(
  entries: MemberVoteEntry[]
): FactionGroup[] {
  const groups: FactionGroup[] = [];
  const factionToGroup = new Map<string, FactionGroup>();

  for (const entry of entries) {
    let group = factionToGroup.get(entry.faction);
    if (!group) {
      group = { faction: entry.faction, members: [] };
      factionToGroup.set(entry.faction, group);
      groups.push(group);
    }
    group.members.push({ name: entry.name, vote: entry.vote });
  }

  return groups;
}

/** 賛成・反対の人数を集計する */
export function countVotes(entries: MemberVoteEntry[]): {
  yes: number;
  no: number;
} {
  let yes = 0;
  let no = 0;
  for (const entry of entries) {
    if (entry.vote === "yes") yes += 1;
    else if (entry.vote === "no") no += 1;
  }
  return { yes, no };
}

/**
 * 賛否の集計を表示用テキストとaria-labelに整形する。
 * 「賛否 X対Y」だとどちらが賛成/反対か初見で分からないため、
 * 「賛成X・反対Y」の形式に統一する
 */
export function formatVoteCounts(
  yes: number,
  no: number
): { text: string; ariaLabel: string } {
  return {
    text: `賛成${yes}・反対${no}`,
    ariaLabel: `賛成${yes}対反対${no}`,
  };
}
