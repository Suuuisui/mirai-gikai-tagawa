import { JumpNav, type JumpNavEntry } from "@/components/ui/jump-nav";

/** トップページのセクションに付与するアンカーid */
export const TOP_SECTION_IDS = {
  featured: "featured-bills",
  previousSession: "previous-session",
  about: "about",
} as const;

/** タグ別セクション（BillsByTagSection）のアンカーidを作る */
export function tagSectionId(tagLabel: string): string {
  return `tag-section-${tagLabel}`;
}

interface SectionJumpNavProps {
  /** タグ別セクションの表示順どおりのタグ名 */
  tagLabels: string[];
  /** 前回の会期セクション（Archive）を表示しているか */
  hasPreviousSession: boolean;
}

/**
 * トップページのセクションへのページ内ジャンプナビ。
 * トップは全カテゴリの議案カードが縦に並び非常に長いため、
 * 目的のカテゴリへ1タップで移動できるようにする
 */
export function SectionJumpNav({
  tagLabels,
  hasPreviousSession,
}: SectionJumpNavProps) {
  const entries: JumpNavEntry[] = [
    { label: "注目の議案", href: `#${TOP_SECTION_IDS.featured}` },
    ...tagLabels.map((label) => ({
      label,
      href: `#${tagSectionId(label)}`,
    })),
    ...(hasPreviousSession
      ? [{ label: "過去の会期", href: `#${TOP_SECTION_IDS.previousSession}` }]
      : []),
    { label: "みらい議会とは", href: `#${TOP_SECTION_IDS.about}` },
  ];

  return <JumpNav entries={entries} />;
}
