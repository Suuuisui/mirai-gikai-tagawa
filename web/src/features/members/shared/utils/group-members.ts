import type { MemberProfile } from "../data/member-profiles";
import type { MemberSummary } from "./aggregate-members";

/** 議員一覧の1グループ（現在の会派、または元議員） */
export interface MemberListGroup {
  label: string;
  /** 賛否の記録がある議員 */
  members: MemberSummary[];
  /** 現職だが賛否の記録がまだ無い議員の姓（補欠選挙で当選した議員など） */
  membersWithoutVotes: string[];
}

export const FORMER_MEMBERS_LABEL = "元議員";

/** 現職で会派の記載が無い場合のグループ名 */
const NO_FACTION_LABEL = "会派なし";

/**
 * 議員一覧を、公式名簿（MEMBER_PROFILES）の現在の会派ごとにまとめる。
 * 採決当時の会派（member_votes）で分けると会派の再編前の所属が出てしまうため、名簿の会派を使う。
 * 現職で賛否の記録がまだ無い議員も会派の中に加え、元議員（名簿に無い姓を含む）は最後に1つにまとめる。
 * 会派は人数の多い順、同数なら名前順
 */
export function groupMembersForList(
  members: readonly MemberSummary[],
  profiles: Readonly<Record<string, MemberProfile>>
): MemberListGroup[] {
  const current = new Map<string, MemberListGroup>();
  const groupFor = (label: string): MemberListGroup => {
    const existing = current.get(label);
    if (existing) return existing;
    const created: MemberListGroup = {
      label,
      members: [],
      membersWithoutVotes: [],
    };
    current.set(label, created);
    return created;
  };

  const former: MemberSummary[] = [];
  for (const member of members) {
    const profile = profiles[member.name];
    if (profile?.isIncumbent) {
      groupFor(profile.faction ?? NO_FACTION_LABEL).members.push(member);
    } else {
      former.push(member);
    }
  }

  const namesWithVotes = new Set(members.map((member) => member.name));
  for (const [name, profile] of Object.entries(profiles)) {
    if (profile.isIncumbent && !namesWithVotes.has(name)) {
      groupFor(profile.faction ?? NO_FACTION_LABEL).membersWithoutVotes.push(
        name
      );
    }
  }

  const size = (group: MemberListGroup) =>
    group.members.length + group.membersWithoutVotes.length;
  const groups = [...current.values()].sort(
    (a, b) => size(b) - size(a) || a.label.localeCompare(b.label, "ja")
  );
  if (former.length > 0) {
    groups.push({
      label: FORMER_MEMBERS_LABEL,
      members: former,
      membersWithoutVotes: [],
    });
  }
  return groups;
}
