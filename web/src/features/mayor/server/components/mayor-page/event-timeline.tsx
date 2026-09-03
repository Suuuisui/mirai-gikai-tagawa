import { Badge } from "@/components/ui/badge";
import { formatDateWithDots } from "@/lib/utils/date";
import type { TimelineItem } from "../../loaders/get-mayor-activity";
import { SourceLink } from "./source-link";

interface EventTimelineProps {
  items: TimelineItem[];
  /** 先頭の項目に「最新」バッジを付ける（新しい順の一覧で使う） */
  markLatest?: boolean;
}

/** 日付・見出し・説明・出典リンクを縦のタイムラインで並べる */
export function EventTimeline({
  items,
  markLatest = false,
}: EventTimelineProps) {
  return (
    <ol className="relative flex flex-col gap-6 border-l-2 border-mirai-border-muted pl-6">
      {items.map((event, index) => (
        <li key={`${event.date}-${event.title}`} className="relative">
          <span
            aria-hidden
            className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-white bg-primary"
          />
          <div className="flex flex-wrap items-center gap-2">
            <time
              dateTime={event.date}
              className="text-xs font-bold text-primary-accent"
            >
              {formatDateWithDots(event.date)}
            </time>
            {markLatest && index === 0 && (
              <Badge className="text-[11px]">最新</Badge>
            )}
          </div>
          <h3 className="mt-0.5 text-[15px] font-bold leading-relaxed text-mirai-text">
            {event.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-mirai-text-secondary">
            {event.description}
          </p>
          {event.link && (
            <SourceLink link={event.link} className="mt-1.5 text-xs" />
          )}
        </li>
      ))}
    </ol>
  );
}
