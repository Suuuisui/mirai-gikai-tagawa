import { TableOfContents } from "lucide-react";
import { extractH2Headings } from "@/lib/markdown/extract-h2-headings";
import { HEADING_ID_PREFIX } from "@/lib/markdown/rehype-heading-ids";

/** 目次を表示する最小の見出し数（1件だけなら目次は冗長なので出さない） */
const MIN_HEADINGS = 2;

interface BillTocProps {
  /** 議案本文（Markdown）。h2見出しを目次項目として抽出する */
  markdownContent: string | null | undefined;
  /** 議員別の賛否セクションが表示されるページかどうか */
  showMemberVotes: boolean;
}

interface TocEntry {
  label: string;
  href: string;
}

/**
 * 議案詳細ページの目次。
 * 解説が長いページでも読みたいセクションへページ内ジャンプできるようにする。
 * リンク先のidは rehype-heading-ids.ts（本文h2）とbill-detail-layout.tsx
 * （議員別の賛否）が付与する
 */
export function BillToc({ markdownContent, showMemberVotes }: BillTocProps) {
  const headings = markdownContent ? extractH2Headings(markdownContent) : [];

  if (headings.length < MIN_HEADINGS) {
    return null;
  }

  const entries: TocEntry[] = [
    ...(showMemberVotes
      ? [{ label: "議員別の賛否", href: "#member-votes" }]
      : []),
    ...headings.map((label, index) => ({
      label,
      href: `#${HEADING_ID_PREFIX}${index}`,
    })),
  ];

  return (
    <nav
      aria-label="このページの目次"
      className="rounded-md bg-white px-4 py-6"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-black">
        <TableOfContents
          aria-hidden="true"
          className="h-4 w-4 text-primary-accent"
        />
        目次
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.href}>
            <a
              href={entry.href}
              className="inline-flex items-start gap-2 text-sm text-mirai-text underline decoration-mirai-border decoration-dotted underline-offset-[3px] transition-opacity hover:opacity-70"
            >
              <span
                aria-hidden="true"
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary-accent"
              />
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
