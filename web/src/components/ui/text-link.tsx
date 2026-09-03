import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TextLinkProps = {
  className?: string;
  children: ReactNode;
} & (
  | {
      /** 外部サイトへのリンク。新しいタブで開き、アイコンで見分けられるようにする */
      external: true;
      href: string;
    }
  | { external?: false; href: Route }
);

/** 本文中の文字リンク（「〜をすべて見る」「出典: 〜」など）の共通スタイル */
export function TextLink({ className, children, ...link }: TextLinkProps) {
  const classes = cn(
    "inline-flex w-fit items-center gap-1 font-bold text-primary underline-offset-4 hover:underline",
    className
  );
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
        <ExternalLink aria-hidden className="size-3" />
      </a>
    );
  }
  return (
    <Link href={link.href} className={classes}>
      {children}
    </Link>
  );
}
