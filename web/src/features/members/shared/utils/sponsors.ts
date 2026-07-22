/** 議案の提出者・賛成者（連署議員）1名分 */
export type SponsorPerson = { name: string; title?: string };

/** bills.sponsors（jsonbカラム）の中身 */
export type BillSponsors = {
  proposers: SponsorPerson[];
  supporters: SponsorPerson[];
  sourceUrl: string;
};

function isSponsorPerson(value: unknown): value is SponsorPerson {
  if (typeof value !== "object" || value === null) return false;
  const person = value as Record<string, unknown>;
  if (typeof person.name !== "string" || person.name === "") return false;
  if (person.title !== undefined && typeof person.title !== "string") {
    return false;
  }
  return true;
}

/**
 * bills.sponsors（jsonbカラム）の値を検証してBillSponsorsに変換する。
 * 想定形式でない値・proposersが空/不正な要素を含む場合はnullを返す
 * （提出者・賛成者データが無い議案、またはデータ不整合時にセクションを
 * 非表示にするため。市長提出等ではnullが入る想定）
 */
export function parseBillSponsors(value: unknown): BillSponsors | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.sourceUrl !== "string" || candidate.sourceUrl === "") {
    return null;
  }

  if (!Array.isArray(candidate.proposers) || candidate.proposers.length === 0) {
    return null;
  }
  if (!candidate.proposers.every(isSponsorPerson)) {
    return null;
  }

  let supporters: SponsorPerson[] = [];
  if (candidate.supporters !== undefined && candidate.supporters !== null) {
    if (
      !Array.isArray(candidate.supporters) ||
      !candidate.supporters.every(isSponsorPerson)
    ) {
      return null;
    }
    supporters = candidate.supporters as SponsorPerson[];
  }

  return {
    proposers: candidate.proposers as SponsorPerson[],
    supporters,
    sourceUrl: candidate.sourceUrl,
  };
}

/**
 * 「姓 名」形式（半角スペース区切り）の氏名から姓を取り出す。
 * 区切りが無い場合は全体を姓として返す
 */
export function extractFamilyName(fullName: string): string {
  const spaceIndex = fullName.indexOf(" ");
  return spaceIndex === -1 ? fullName : fullName.slice(0, spaceIndex);
}

/**
 * 議案の提出者・賛成者一覧から、氏名（姓 名）の一覧を集める
 */
export function collectSponsorNames(sponsorsList: BillSponsors[]): string[] {
  return sponsorsList.flatMap((sponsors) => [
    ...sponsors.proposers.map((person) => person.name),
    ...sponsors.supporters.map((person) => person.name),
  ]);
}

/**
 * 氏名一覧の中から、指定した姓に一致するユニークなフルネームを1つだけ
 * 特定できる場合にそれを返す。一致が0件、または表記ゆれ等で2件以上の
 * 異なるフルネームが見つかった場合はnull（呼び出し側は姓のみで表示する）
 */
export function findUniqueFullName(
  names: string[],
  familyName: string
): string | null {
  const matches = new Set(
    names.filter((name) => extractFamilyName(name) === familyName)
  );
  return matches.size === 1 ? [...matches][0] : null;
}
