import { BookOpen } from "lucide-react";
import { ShowMoreList } from "@/components/ui/show-more-list";
import type { GlossaryEntry } from "../../shared/data/glossary";

/** 最初から全部見せる上限。予算の議案は30語近く並ぶので、それ以上は畳む */
const INITIAL_COUNT = 8;

interface GlossarySectionProps {
  entries: GlossaryEntry[];
  /** 見出し。議案ページでは「この議案に出てくることば」にする */
  title?: string;
}

/** ページに出てくることばの一覧（本文中に印を付けた語も、付けていない語もまとめて読める） */
export function GlossarySection({
  entries,
  title = "このページに出てくることば",
}: GlossarySectionProps) {
  if (entries.length === 0) return null;
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-lg border border-mirai-border-muted bg-mirai-surface px-5 py-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-mirai-text">
        <BookOpen aria-hidden className="size-4 text-primary-accent" />
        {title}
        <span className="font-medium text-mirai-text-muted">
          {entries.length}語
        </span>
      </h2>
      <ShowMoreList
        initialCount={INITIAL_COUNT}
        className="flex flex-col gap-3"
      >
        {entries.map((entry) => (
          <div key={entry.term} className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-mirai-text">{entry.term}</p>
            <p className="text-xs leading-relaxed text-mirai-text-secondary">
              {entry.description}
            </p>
          </div>
        ))}
      </ShowMoreList>
    </section>
  );
}
