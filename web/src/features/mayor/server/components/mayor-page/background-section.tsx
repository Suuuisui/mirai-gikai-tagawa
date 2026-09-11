import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import {
  FORMER_MAYOR_NAME,
  MAYOR_PROFILE,
  ROAD_TO_INAUGURATION_SUMMARY,
} from "../../../shared/data/mayor-profile";
import { compactName } from "../../../shared/utils/mayor-activity";
import type { TimelineItem } from "../../loaders/get-mayor-activity";
import { EventTimeline } from "./event-timeline";
import { MAYOR_SECTIONS } from "./section-ids";

const MAYOR_NAME = compactName(MAYOR_PROFILE.name);
const TIMELINE_NOTE = `前市長・${FORMER_MAYOR_NAME}氏の問題が表面化してから、${MAYOR_NAME}市長の就任までを古い順に並べています。各項目から当時の記録に飛べます。`;

interface BackgroundSectionProps {
  /** 古い順 */
  background: TimelineItem[];
}

/** 前市長の問題が表面化してから新市長就任までの経緯 */
export function BackgroundSection({ background }: BackgroundSectionProps) {
  return (
    <section
      id={MAYOR_SECTIONS.background.id}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>なぜ市長が交代したのか</SectionHeading>
      <p className="rounded-lg bg-mirai-surface-key-subtle px-4 py-3.5 text-sm leading-relaxed text-mirai-text">
        {ROAD_TO_INAUGURATION_SUMMARY}
      </p>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        {TIMELINE_NOTE}
      </p>
      <EventTimeline items={background} />
    </section>
  );
}
