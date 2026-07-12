export interface SocialLink {
  name: string;
  url: string;
}

/**
 * 運営者（田川市政ラボ）のSNSリンク定義
 */
export const SOCIAL_LINKS = {
  instagram: {
    name: "Instagram",
    url: "https://www.instagram.com/cve1862/",
  },
} as const satisfies Record<string, SocialLink>;
