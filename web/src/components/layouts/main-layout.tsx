"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isInterviewSection, isMainPage } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterview = isInterviewSection(pathname);

  return (
    <div
      className={cn(
        // lg未満はヘッダーが2段（クイックナビ行あり）で高くなるため、
        // lg以上（1段ヘッダー）よりも大きめの上余白を確保する。
        // ヒーロー/カバー画像を画面最上部まで表示するメインページ（TOP・議案詳細）と
        // インタビューセクションのみ、モバイルでは上余白なしで最上部から描画する
        "relative max-w-[700px] mx-auto lg:mt-24",
        useSidebarLayout || isInterview ? "md:mt-36" : "mt-36",
        // インタビューページ以外ではshadowを表示
        !isInterview && "sm:shadow-lg",
        // TOPページと議案詳細ページのみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]"
      )}
    >
      {children}
    </div>
  );
}
