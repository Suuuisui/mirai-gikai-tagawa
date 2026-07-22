"use client";

import type { LucideIcon } from "lucide-react";
import { Info, Landmark, Search, Users } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InterviewHeaderActions } from "@/features/interview-session/client/components/interview-header-actions";
import { isInterviewPage } from "@/lib/page-layout-utils";
import { routes } from "@/lib/routes";
import { HamburgerMenu } from "./hamburger-menu";

type NavLinkItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// lg以上（デスクトップ）: ロゴ右側に主要ページへのテキストリンクを並べる
const DESKTOP_NAV_LINKS: NavLinkItem[] = [
  { label: "議案を検索", href: routes.search(), icon: Search },
  {
    label: "議会ごとのまとめ",
    href: routes.sessionArchive(),
    icon: Landmark,
  },
  {
    label: "議員・提出者から見る",
    href: routes.memberArchive(),
    icon: Users,
  },
  { label: "みらい議会とは", href: `${routes.home()}#about`, icon: Info },
];

// lg未満（モバイル）: ヘッダー2段目の横スクロールクイックナビ
const MOBILE_QUICK_LINKS: NavLinkItem[] = [
  { label: "議会まとめ", href: routes.sessionArchive(), icon: Landmark },
  { label: "議案を検索", href: routes.search(), icon: Search },
  {
    label: "議員・提出者から見る",
    href: routes.memberArchive(),
    icon: Users,
  },
];

// 難易度切り替え（説明をもっと詳しく）は、田川市版では hard 難易度の
// 議案本文を用意していないため一時的に非表示にしている。
// hard 版コンテンツを用意した際に DifficultySelector を復活させること。
export function HeaderClient() {
  const pathname = usePathname();
  const showInterviewActions = isInterviewPage(pathname);

  return (
    <header className="px-3 fixed top-4 left-0 right-0 z-40 max-w-[1440px] mx-auto">
      <div className="rounded-2xl bg-white shadow-sm mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo / Site Title */}
          <Link
            href={routes.home()}
            className="flex min-w-0 flex-1 items-center space-x-2 lg:flex-none"
            aria-label="ホーム"
          >
            <Image
              src="/img/logo.svg"
              alt="みらい議会＠田川市"
              width={42}
              height={36}
              className="shrink-0"
            />
            <Image
              src="/img/service-logo.svg"
              alt="みらい議会＠田川市"
              width={115}
              height={21}
              className="h-auto w-[96px] shrink-0 sm:w-[115px]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            {/* デスクトップ用テキストナビ（lg以上のみ表示） */}
            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="主要ナビゲーション"
            >
              {DESKTOP_NAV_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href as Route}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-mirai-text transition-colors hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary-accent" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* モバイル用検索アイコン（lg未満のみ表示） */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 lg:hidden"
            >
              <Link href={routes.search()} aria-label="議案を検索">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {showInterviewActions && <InterviewHeaderActions />}
            <HamburgerMenu />
          </div>
        </div>

        {/* モバイル用クイックナビ（lg未満のみ表示、横スクロール） */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-2.5 scrollbar-hide lg:hidden"
          aria-label="クイックナビゲーション"
        >
          {MOBILE_QUICK_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href as Route}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-mirai-border bg-mirai-surface px-3 py-1.5 text-sm font-medium text-mirai-text shadow-xs transition-all hover:bg-muted/50 active:scale-95"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary-accent" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
