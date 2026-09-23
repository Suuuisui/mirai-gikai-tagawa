"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GlossaryTermProps {
  /** 見出し語（説明の題） */
  term: string;
  description: string;
  /** 本文中の語（見出し語と違う表記のこともある） */
  children: ReactNode;
}

/**
 * 本文中のむずかしいことば。点線の下線を付け、タップ（クリック）で短い説明を出す。
 * スマホではホバーが使えないため、title 属性ではなくポップオーバーにしている。
 * 文字の大きさ・太さ・行間は周りの文章に合わせる（Button の既定の text-sm / font-bold を上書き）。
 * ボタンの名前は本文の語そのもの（読み上げで文の流れを壊さない）
 */
export function GlossaryTerm({
  term,
  description,
  children,
}: GlossaryTermProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="inline h-auto whitespace-normal rounded-none border-b border-dotted border-primary-accent p-0 align-baseline font-normal text-[length:inherit] leading-[inherit] text-inherit hover:bg-transparent hover:text-primary-accent"
        >
          {children}
          <span className="sr-only">（ことばの説明）</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        aria-label={term}
        className="w-72 p-3"
      >
        <p className="text-sm font-bold text-mirai-text">{term}</p>
        <p className="mt-1 text-xs leading-relaxed text-mirai-text-secondary">
          {description}
        </p>
      </PopoverContent>
    </Popover>
  );
}
