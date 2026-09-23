/**
 * 議員名の表記ゆれを吸収する【田川市専用】
 *
 * 公式ページでは「山野　義人」「北 山 隆 之」「梶原みつ子」「榊󠄀原大祐」
 * 「村𠮷勇介」のように、空白の入り方や異体字がページごとに違う。
 * web 側の議員ページのキー（member_votes の姓表記: 榊原・村吉・辻 …）に
 * 合わせるため、異体字を寄せた上で既知の姓リストで姓と名を分ける
 */

import { COUNCIL_FAMILY_NAMES } from "@mirai-gikai/shared/council/family-names";
import { compactSpaces } from "./council-html-utils";

/** 長い姓を先に照合する（「佐々木」を「佐藤」より先に試すため） */
const FAMILY_NAMES_LONGEST_FIRST = [...COUNCIL_FAMILY_NAMES].sort(
  (a, b) => b.length - a.length
);

/**
 * 姓そのものの別表記 → member_votes の表記。
 * 1文字ずつの置換（高→髙）だと他の人名まで変わるため、姓単位で寄せる
 */
const FAMILY_NAME_ALIASES: Record<string, string> = {
  高瀬: "髙瀬",
  尾崎: "尾﨑",
};

/** 1文字単位で寄せる異体字（人名でこの字が別人を表すことは無い） */
const VARIANT_CHARS: Record<string, string> = {
  "𠮷": "吉",
  "瀨": "瀬",
};

/** 異体字セレクタ（U+FE00–FE0F, U+E0100–E01EF）を外し、member_votes と同じ字体に寄せる */
export function normalizeNameChars(name: string): string {
  return name
    .normalize("NFC")
    .replace(/[\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]/gu, "")
    .replace(/[𠮷瀨]/gu, (c) => VARIANT_CHARS[c] ?? c);
}

/** 照合用: 異体字を寄せて空白を除いた氏名 */
export function compactName(name: string): string {
  return compactSpaces(normalizeNameChars(name));
}

export interface PersonName {
  /** 表示名（姓 名。名が分からなければ姓のみ） */
  name: string;
  /** 姓 */
  familyName: string;
}

function applyFamilyAlias(compact: string): string {
  for (const [alias, canonical] of Object.entries(FAMILY_NAME_ALIASES)) {
    if (compact.startsWith(alias)) return canonical + compact.slice(alias.length);
  }
  return compact;
}

/**
 * 公式ページの氏名表記を「姓 名」に正規化する。
 * 1. 既知の姓に前方一致すればそこで分ける
 * 2. 空白で2つに分かれていれば前半を姓とする
 * 3. どちらでもなければ先頭2文字を姓とみなす
 */
export function normalizePersonName(raw: string): PersonName {
  const normalized = normalizeNameChars(raw).replace(/[\s\u00a0\u3000]+/g, " ").trim();
  const compact = applyFamilyAlias(compactSpaces(normalized));
  const known = FAMILY_NAMES_LONGEST_FIRST.find(
    (family) => compact.startsWith(family) && compact.length > family.length
  );
  if (known) {
    return { name: `${known} ${compact.slice(known.length)}`, familyName: known };
  }
  const tokens = normalized.split(" ").filter((token) => token.length > 0);
  if (tokens.length === 2) {
    return { name: `${tokens[0]} ${tokens[1]}`, familyName: tokens[0] };
  }
  if (compact.length <= 2) {
    return { name: compact, familyName: compact };
  }
  return { name: `${compact.slice(0, 2)} ${compact.slice(2)}`, familyName: compact.slice(0, 2) };
}
