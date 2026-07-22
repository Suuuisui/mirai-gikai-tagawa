import { MEMBER_PROFILES, type MemberProfile } from "../data/member-profiles";
import { findUniqueFullName } from "./sponsors";

/**
 * 姓（member_votes / sponsorsデータの表記）から、公式名簿由来のプロフィールを
 * 取得する。名簿に無い姓（データ不備等）はnullを返す
 */
export function resolveMemberProfile(familyName: string): MemberProfile | null {
  return MEMBER_PROFILES[familyName] ?? null;
}

/**
 * 議員の表示名（フルネーム）を解決する。優先順:
 * 1. MEMBER_PROFILES（公式名簿）のfullName
 * 2. sponsorsデータ中で姓に一致するフルネームがちょうど1つだけ見つかる場合、それ
 * 3. どちらも無ければ姓のみ
 */
export function resolveMemberDisplayName(
  familyName: string,
  sponsorNames: string[]
): string {
  const profile = resolveMemberProfile(familyName);
  if (profile) return profile.fullName;
  return findUniqueFullName(sponsorNames, familyName) ?? familyName;
}
