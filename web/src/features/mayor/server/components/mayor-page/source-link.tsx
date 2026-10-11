import { TextLink } from "@/components/ui/text-link";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { cn } from "@/lib/utils";
import type { ResolvedLink } from "../../../shared/utils/mayor-activity";

interface SourceLinkProps {
  link: ResolvedLink;
  className?: string;
  /** リンクの前に、リンク先のもとの資料の区分（出典バッジ）を添える */
  showSource?: boolean;
}

/** 出典へのリンク。ローダーが解決した ResolvedLink をそのまま文字リンクにする */
export function SourceLink({
  link,
  className,
  showSource = false,
}: SourceLinkProps) {
  const source = showSource ? link.source : undefined;
  // バッジを添えるときは、外側の枠に className を当てる
  const linkClassName = source ? undefined : className;
  const anchor = link.external ? (
    <TextLink external href={link.href} className={linkClassName}>
      {link.label}
    </TextLink>
  ) : (
    <TextLink href={link.href} className={linkClassName}>
      {link.label}
    </TextLink>
  );
  if (!source) return anchor;
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1",
        className
      )}
    >
      <SourceBadge
        kind={source.kind}
        detail={source.detail}
        className="px-1.5 py-0 text-[11px]"
      />
      {anchor}
    </span>
  );
}
