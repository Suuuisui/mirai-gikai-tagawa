import type { ReactNode } from "react";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

interface TurnoutSectionProps {
  /** ページ内アンカー（TURNOUT_SECTIONS の id） */
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** 投票率ページのセクションの枠: アンカー・見出し・ひとこと説明 */
export function TurnoutSection({
  id,
  title,
  description,
  children,
}: TurnoutSectionProps) {
  return (
    <section id={id} className={cn(jumpTargetClassName, "flex flex-col gap-4")}>
      <div className="flex flex-col gap-1.5">
        <SectionHeading>{title}</SectionHeading>
        <p className="text-xs font-medium text-mirai-text-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
