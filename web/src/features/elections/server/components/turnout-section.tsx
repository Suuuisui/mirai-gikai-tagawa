import type { ReactNode } from "react";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import type { SourceTag } from "@/features/sources/shared/data/source-kinds";
import { cn } from "@/lib/utils";

/** 開示請求で交付を受けた「投票結果速報集計用紙（結了報告）」 */
export const SOURCE_TALLY_SHEET: SourceTag = {
  kind: "disclosure",
  detail: "投票結果の集計用紙",
};

/** 開示請求で交付を受けた「年代別 投票者数・投票率」 */
export const SOURCE_AGE_TABLE: SourceTag = {
  kind: "disclosure",
  detail: "年代別の投票者数・投票率",
};

interface TurnoutSectionProps {
  /** ページ内アンカー（TURNOUT_SECTIONS の id） */
  id: string;
  title: string;
  description: string;
  /** このセクションの数字のもと（複数あれば並べる） */
  sources: readonly SourceTag[];
  children: ReactNode;
}

/** 投票率ページのセクションの枠: アンカー・見出し・ひとこと説明・出典バッジ */
export function TurnoutSection({
  id,
  title,
  description,
  sources,
  children,
}: TurnoutSectionProps) {
  return (
    <section id={id} className={cn(jumpTargetClassName, "flex flex-col gap-4")}>
      <div className="flex flex-col gap-1.5">
        <SectionHeading>{title}</SectionHeading>
        <p className="text-xs font-medium text-mirai-text-muted">
          {description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <SourceBadge
              key={`${source.kind}-${source.detail}`}
              kind={source.kind}
              detail={source.detail}
            />
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}
