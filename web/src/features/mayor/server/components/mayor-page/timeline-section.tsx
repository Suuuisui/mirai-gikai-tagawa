import { SectionHeading } from "@/components/ui/section-heading";
import { formatDateWithDots } from "@/lib/utils/date";
import type { TimelineItem } from "../../loaders/get-mayor-activity";
import { SourceLink } from "./source-link";

interface TimelineSectionProps {
  timeline: TimelineItem[];
}

/** 前市長の問題が表面化してから新市長就任までの経緯 */
export function TimelineSection({ timeline }: TimelineSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>就任までの経緯</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        前市長の問題が表面化してから、新市長が就任するまでの流れです。各項目から当時の記録に飛べます。
      </p>
      <ol className="relative flex flex-col gap-6 border-l-2 border-mirai-border-muted pl-6">
        {timeline.map((event) => (
          <li key={`${event.date}-${event.title}`} className="relative">
            <span
              aria-hidden
              className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-white bg-primary"
            />
            <time
              dateTime={event.date}
              className="text-xs font-bold text-primary-accent"
            >
              {formatDateWithDots(event.date)}
            </time>
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
    </section>
  );
}
