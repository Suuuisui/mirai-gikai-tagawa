import { FileText } from "lucide-react";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "../../loaders/get-mayor-activity";
import { EventTimeline } from "./event-timeline";
import { MAYOR_SECTIONS } from "./section-ids";

interface ActionsSectionProps {
  /** 新しい順 */
  actions: TimelineItem[];
}

/** 就任後に市長と執行部が議会でしたことを、出典付きで新しい順に並べる */
export function ActionsSection({ actions }: ActionsSectionProps) {
  return (
    <section
      id={MAYOR_SECTIONS.actions.id}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>就任後にしたこと</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        委員会の記録と市の公式情報から、市長と市役所（執行部）の動きを新しい順に拾っています。各項目から出典の記録に飛べます。
      </p>
      <EventTimeline items={actions} markLatest />
      <TextLink href={routes.committees()} className="text-sm">
        <FileText aria-hidden className="size-4" />
        委員会の記録をすべて見る
      </TextLink>
    </section>
  );
}
