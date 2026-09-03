import { TextLink } from "@/components/ui/text-link";
import type { ResolvedLink } from "../../../shared/utils/mayor-activity";

interface SourceLinkProps {
  link: ResolvedLink;
  className?: string;
}

/** 出典へのリンク。ローダーが解決した ResolvedLink をそのまま文字リンクにする */
export function SourceLink({ link, className }: SourceLinkProps) {
  return link.external ? (
    <TextLink external href={link.href} className={className}>
      {link.label}
    </TextLink>
  ) : (
    <TextLink href={link.href} className={className}>
      {link.label}
    </TextLink>
  );
}
