import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ResolvedLink } from "../../../shared/utils/mayor-activity";

interface SourceLinkProps {
  link: ResolvedLink;
  className?: string;
}

/** 出典へのリンク。外部は新しいタブで開き、アイコンで見分けられるようにする */
export function SourceLink({ link, className }: SourceLinkProps) {
  const classes = cn(
    "inline-flex items-center gap-1 font-bold text-primary underline-offset-4 hover:underline",
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
        {link.label}
        <ExternalLink aria-hidden className="size-3" />
      </a>
    );
  }
  return (
    <Link href={link.href} className={classes}>
      {link.label}
    </Link>
  );
}
