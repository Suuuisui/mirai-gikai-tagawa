import { Vote } from "lucide-react";
import { jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  COUNCIL_BY_ELECTION,
  type ElectionCandidate,
  MAYORAL_ELECTION,
} from "../../../shared/data/mayor-profile";
import { calculateVoteShares } from "../../../shared/utils/mayor-activity";
import { MAYOR_SECTIONS } from "./section-ids";
import { SourceLink } from "./source-link";

const STATUS_LABELS: Record<ElectionCandidate["status"], string> = {
  新: "新人",
  前: "前職",
  元: "元職",
};

const numberFormat = new Intl.NumberFormat("ja-JP");

/** 市長選と同日の市議補選の結果（出典: 市の投開票速報） */
export function ElectionSection() {
  return (
    <section
      id={MAYOR_SECTIONS.election.id}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>市長選挙の結果</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        {formatDateWithDots(MAYORAL_ELECTION.date)}執行。
        {MAYORAL_ELECTION.reason}です。
      </p>
      <VoteResultList candidates={MAYORAL_ELECTION.candidates} />
      <h3 className="mt-2 flex items-center gap-1.5 text-sm font-bold text-mirai-text">
        <Vote aria-hidden className="size-4 text-primary-accent" />
        同じ日の市議会議員補欠選挙（欠員{COUNCIL_BY_ELECTION.seats}）
      </h3>
      <VoteResultList candidates={COUNCIL_BY_ELECTION.candidates} />
      <SourceLink
        link={{
          href: MAYORAL_ELECTION.sourceUrl,
          label: "出典: 田川市の投・開票速報",
          external: true,
        }}
        className="w-fit text-xs"
      />
    </section>
  );
}

interface VoteResultListProps {
  candidates: readonly ElectionCandidate[];
}

/** 候補者ごとの得票を、最多得票を基準にした棒グラフ付きで並べる */
function VoteResultList({ candidates }: VoteResultListProps) {
  return (
    <ul className="flex flex-col divide-y divide-mirai-border-muted rounded-lg border border-mirai-border-muted bg-white px-4">
      {calculateVoteShares(candidates).map((candidate) => (
        <li key={candidate.name} className="flex flex-col gap-1.5 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {candidate.elected && (
                <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
                  当選
                </span>
              )}
              <span className="font-bold text-mirai-text">
                {candidate.name}
              </span>
              <span className="text-xs text-mirai-text-muted">
                {STATUS_LABELS[candidate.status]}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-mirai-text">
              <span className="font-bold">
                {numberFormat.format(candidate.votes)}
              </span>
              票
              <span className="ml-1.5 text-xs text-mirai-text-muted">
                {candidate.percent.toFixed(1)}%
              </span>
            </span>
          </div>
          <div
            aria-hidden
            className="h-1.5 w-full overflow-hidden rounded-full bg-mirai-progress-track"
          >
            <div
              className={cn(
                "h-full rounded-full",
                candidate.elected ? "bg-primary" : "bg-gray-300"
              )}
              style={{ width: `${candidate.relative}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
