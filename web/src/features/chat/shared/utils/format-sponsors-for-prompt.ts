import {
  parseBillSponsors,
  type SponsorPerson,
} from "@/features/members/shared/utils/sponsors";

function formatSponsorPerson(person: SponsorPerson): string {
  return person.title ? `${person.title} ${person.name}` : person.name;
}

/**
 * bills.sponsors（jsonbカラム）の値を、チャットのシステムプロンプトに
 * 埋め込むためのテキストに整形する。
 *
 * データが無い/形式が不正な議案（市長提出等を含む）では空文字を返す
 * （プロンプト側でセクションごと省略するため）。
 */
export function formatSponsorsForPrompt(sponsors: unknown): string {
  const parsed = parseBillSponsors(sponsors);
  if (parsed === null) return "";

  const { proposers, supporters } = parsed;

  const lines = [`提出者: ${proposers.map(formatSponsorPerson).join("、")}`];
  if (supporters.length > 0) {
    lines.push(
      `賛成者（連署議員）: ${supporters.map(formatSponsorPerson).join("、")}`
    );
  }

  return lines.join("\n");
}
