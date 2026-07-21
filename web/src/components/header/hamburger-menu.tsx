"use client";

import {
  Home,
  Info,
  Landmark,
  type LucideIcon,
  Menu,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { routes } from "@/lib/routes";
import { RubyToggle } from "@/lib/rubyful";

type NavLinkItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_LINKS: NavLinkItem[] = [
  { label: "ホーム", href: routes.home(), icon: Home },
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
  // トップページのAboutセクション（id="about"）へのアンカーリンク
  { label: "みらい議会とは", href: `${routes.home()}#about`, icon: Info },
];

type InfoLinkItem = {
  label: string;
  href: string;
};

const INFO_LINKS: InfoLinkItem[] = [
  { label: "利用規約", href: routes.terms() },
  { label: "プライバシーポリシー", href: routes.privacy() },
];

export function HamburgerMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <nav className="flex flex-col" aria-label="メインナビゲーション">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <PopoverClose key={href} asChild>
              <Link
                href={href as Route}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-mirai-text transition-colors hover:bg-muted/50"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary-accent" />
                {label}
              </Link>
            </PopoverClose>
          ))}
        </nav>

        <div className="my-2 border-t border-mirai-border" />

        <div className="px-2 py-1.5">
          <RubyToggle />
        </div>

        <div className="my-2 border-t border-mirai-border" />

        <div className="flex flex-col gap-1 px-2 py-1">
          {INFO_LINKS.map((link) => (
            <PopoverClose key={link.href} asChild>
              <Link
                href={link.href as Route}
                className="py-1 text-xs font-medium text-mirai-text-muted transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            </PopoverClose>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
