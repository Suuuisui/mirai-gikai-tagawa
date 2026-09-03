import { cn } from "@/lib/utils";

export interface JumpNavEntry {
  label: string;
  /** "#section-id" 形式のページ内アンカー */
  href: string;
}

/** ジャンプ先のセクションに付けるクラス。固定ヘッダーの高さぶんスクロール位置をずらす */
export const jumpTargetClassName = "scroll-mt-36";

interface JumpNavProps {
  entries: JumpNavEntry[];
  className?: string;
}

/** ページ内セクションへ1タップで移動するジャンプナビ（長いページの入口に置く） */
export function JumpNav({ entries, className }: JumpNavProps) {
  return (
    <nav
      aria-label="ページ内セクション"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {entries.map((entry) => (
        <a
          key={entry.href}
          href={entry.href}
          className="rounded-lg border border-mirai-border bg-white px-3.5 py-1.5 text-[13px] font-medium text-mirai-text-secondary transition-colors hover:bg-mirai-surface-key"
        >
          {entry.label}
        </a>
      ))}
    </nav>
  );
}
