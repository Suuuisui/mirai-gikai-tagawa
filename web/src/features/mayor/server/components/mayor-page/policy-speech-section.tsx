import { Quote, Youtube } from "lucide-react";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  MAYOR_POLICY_SPEECH,
  type PolicyPillar,
} from "../../../shared/data/mayor-profile";
import type { ResolvedLink } from "../../../shared/utils/mayor-activity";
import { MAYOR_SECTIONS } from "./section-ids";
import { SourceLink } from "./source-link";

interface PolicySpeechSectionProps {
  /** 所信表明を行った本会議の記録へのリンク（一覧に無ければ null） */
  link: ResolvedLink | null;
}

/** 所信表明で掲げた4つの改革と具体策を、読み飛ばせる形で並べる */
export function PolicySpeechSection({ link }: PolicySpeechSectionProps) {
  const speech = MAYOR_POLICY_SPEECH;

  return (
    <section
      id={MAYOR_SECTIONS.speech.id}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>{MAYOR_SECTIONS.speech.navLabel}</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        {formatDateWithDots(speech.source.meetingDate)}
        の本会議（9月定例会の初日）で、就任後はじめて4年間の方針を述べました。本人の言葉の範囲で要点をまとめています。
      </p>

      {/* 基本姿勢 */}
      <ul className="flex flex-col gap-2 rounded-lg bg-mirai-surface-key-subtle px-4 py-4">
        {speech.stance.map((line) => (
          <li
            key={line}
            className="flex gap-2 text-sm leading-relaxed text-mirai-text"
          >
            <Quote
              aria-hidden
              className="mt-1 size-3.5 shrink-0 text-primary-accent"
            />
            {line}
          </li>
        ))}
      </ul>

      {/* 4つの改革 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-mirai-text">4つの改革</h3>
        <p className="text-sm leading-relaxed text-mirai-text-secondary">
          {speech.priority}
        </p>
        <ol className="grid gap-3 md:grid-cols-2">
          {speech.pillars.map((pillar, index) => (
            <PillarCard key={pillar.title} pillar={pillar} number={index + 1} />
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-bold text-mirai-text">
          4つの改革のほかに挙げたこと
        </h3>
        <BulletList items={speech.others} />
      </div>

      {speech.correction && (
        <p className="text-xs leading-relaxed text-mirai-text-muted">
          ※ {speech.correction}。
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {link && <SourceLink link={link} />}
        <TextLink external href={speech.videoUrl}>
          <Youtube aria-hidden className="size-3.5" />
          中継映像で所信表明を見る
        </TextLink>
      </div>
    </section>
  );
}

/** 改革1つ分のカード（番号・名前・目指す姿・具体策） */
function PillarCard({
  pillar,
  number,
}: {
  pillar: PolicyPillar;
  number: number;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-mirai-border-muted bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mirai-surface-key text-xs font-bold text-primary-accent">
          {number}
        </span>
        <span className="text-base font-bold text-mirai-text">
          {pillar.title}
        </span>
      </div>
      <p className="text-xs font-bold text-primary-accent">
        目指す姿: {pillar.goal}
      </p>
      <BulletList items={pillar.items} />
    </li>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm leading-relaxed text-mirai-text-secondary"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
