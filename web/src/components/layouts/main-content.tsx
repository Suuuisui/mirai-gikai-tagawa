"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isMainPage } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: ReactNode;
}

/**
 * TOPページ・議案詳細ページ（isMainPage）はモバイルで固定表示の
 * AIチャットボタン（ChatButton）が画面下部に重なるため、最後のコンテンツが
 * ボタンに隠れないよう下部にゆとりを持たせる。他のページはChatButtonを
 * 表示しないため不要
 */
export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  const hasFixedChatButton = isMainPage(pathname);

  return (
    <main
      className={cn(
        "min-h-dvh md:min-h-[calc(100dvh-96px)] bg-mirai-surface",
        hasFixedChatButton && "pb-24 pc:pb-0"
      )}
    >
      {children}
    </main>
  );
}
