import {
  COMMITTEE_PROFILES,
  getCommitteeProfile,
} from "../data/committee-profiles";

/**
 * 委員会ごとの記録ページ（/committees/group/[slug]）のURLに使う名前。
 * 登録済みの委員会は半角の slug、未登録の委員会（今後データに現れる新しい委員会）は
 * 委員会名そのもの（URLにするときは routes.committeeGroup が encodeURIComponent する）
 */
export function getCommitteeSlug(committeeName: string): string {
  return getCommitteeProfile(committeeName).slug;
}

/**
 * ルートのパラメータから委員会名を引く。
 * - 登録済みの slug に一致すればその委員会名
 * - そうでなければ、実在する委員会名（committeeNames）と完全一致したものだけ
 * - どちらでもなければ null（存在しないURLを 404 にするため）
 * パラメータはパーセントエンコードされていることがあるので戻してから比べる。
 * 壊れたエンコード（%E3 だけなど）は decodeURIComponent が投げるので null にする
 */
export function resolveCommitteeName(
  slugParam: string,
  committeeNames: readonly string[]
): string | null {
  let slug: string;
  try {
    slug = decodeURIComponent(slugParam);
  } catch {
    return null;
  }

  for (const [committeeName, profile] of Object.entries(COMMITTEE_PROFILES)) {
    if (profile.slug === slug) return committeeName;
  }
  return committeeNames.includes(slug) ? slug : null;
}
