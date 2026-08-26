import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** 見出しレベル（ページ構造に応じて h1〜h3 を選ぶ） */
  as?: "h1" | "h2" | "h3";
  className?: string;
  children: ReactNode;
}

/** キーカラーの縦線付きセクション見出し（デザインシステム共通パターン） */
export function SectionHeading({
  as: Tag = "h2",
  className,
  children,
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "border-l-4 border-primary pl-3 text-xl font-bold text-mirai-text",
        className
      )}
    >
      {children}
    </Tag>
  );
}
