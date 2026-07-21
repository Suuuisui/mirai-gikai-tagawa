"use client";

import { Info, Landmark } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InterviewHeaderActions } from "@/features/interview-session/client/components/interview-header-actions";
import { isInterviewPage } from "@/lib/page-layout-utils";
import { routes } from "@/lib/routes";
import { HamburgerMenu } from "./hamburger-menu";

// 難易度切り替え（説明をもっと詳しく）は、田川市版では hard 難易度の
// 議案本文を用意していないため一時的に非表示にしている。
// hard 版コンテンツを用意した際に DifficultySelector を復活させること。
export function HeaderClient() {
  const pathname = usePathname();
  const showInterviewActions = isInterviewPage(pathname);

  return (
    <header className="px-3 fixed top-4 left-0 right-0 z-40 max-w-[1440px] mx-auto">
      <div className="rounded-2xl bg-white shadow-sm mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Site Title */}
          <div className="flex items-center">
            <Link
              href={routes.home()}
              className="flex items-center space-x-2"
              aria-label="ホーム"
            >
              <Image
                src="/img/logo.svg"
                alt="みらい議会＠田川市"
                width={42}
                height={36}
              />
              <Image
                src="/img/service-logo.svg"
                alt="みらい議会＠田川市"
                width={115}
                height={21}
                className="w-[96px] sm:w-[115px] h-auto"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav
            className="flex items-center space-x-2"
            aria-label="補助ナビゲーション"
          >
            {/* スマホではテキストだけだとボタンと分からないため、
                枠線＋角丸のピル型にして押せる見た目にする */}
            <Link
              href={routes.sessionArchive()}
              className="flex items-center gap-1.5 rounded-full border border-mirai-border bg-mirai-surface px-3 py-1.5 text-sm font-medium text-mirai-text shadow-xs transition-all hover:bg-muted/50 active:scale-95 whitespace-nowrap"
            >
              <Landmark className="h-4 w-4 shrink-0 text-primary-accent" />
              議会まとめ
            </Link>
            {/* 狭い画面ではヘッダーが手狭になるため、みらい議会とはリンクは
                sm以上でのみ表示する（議会まとめは常時表示） */}
            <Link
              href={`${routes.home()}#about` as Route}
              className="hidden sm:flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-mirai-text transition-colors hover:bg-muted/50 whitespace-nowrap"
            >
              <Info className="h-4 w-4 shrink-0 text-primary-accent" />
              みらい議会とは
            </Link>
            {showInterviewActions && <InterviewHeaderActions />}
            <HamburgerMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
