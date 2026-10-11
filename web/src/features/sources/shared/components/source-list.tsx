import { useId } from "react";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { SOURCE_KINDS, type SourceRef } from "../data/source-kinds";
import { SourceBadge } from "./source-badge";

interface SourceListProps {
  /** 見出し（例: この議案の情報のもと） */
  title: string;
  items: readonly SourceRef[];
  className?: string;
}

/**
 * 「このページ（この部分）は何をもとにしているか」を、出典バッジと対象の組で並べる箱。
 * 末尾に出典の区分の説明ページへのリンクを置く
 */
export function SourceList({ title, items, className }: SourceListProps) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-mirai-border-muted bg-white px-4 py-3.5",
        className
      )}
    >
      <h2 id={headingId} className="text-xs font-bold text-mirai-text-muted">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={`${item.kind}-${item.detail ?? ""}-${item.scope}`}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-mirai-text-secondary"
          >
            <SourceBadge kind={item.kind} detail={item.detail} />
            <span>{item.scope}</span>
            {item.href && (
              <TextLink external href={item.href} className="text-xs">
                {/* 同じ文言のリンクが並ぶので、読み上げではどの資料かを先に言う */}
                <span className="sr-only">
                  {item.detail ?? SOURCE_KINDS[item.kind].label}の
                </span>
                もとの資料
              </TextLink>
            )}
          </li>
        ))}
      </ul>
      <TextLink href={routes.sources()} className="text-xs">
        出典の種類と読み方について
      </TextLink>
    </section>
  );
}
