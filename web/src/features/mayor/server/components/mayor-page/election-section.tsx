import { Vote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  COUNCIL_BY_ELECTION,
  type ElectionCandidate,
  MAYORAL_ELECTION,
} from "../../../shared/data/mayor-profile";
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
    <section className="flex flex-col gap-4">
      <SectionHeading>市長選挙の結果</SectionHeading>
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        {formatDateWithDots(MAYORAL_ELECTION.date)}執行。
        {MAYORAL_ELECTION.reason}です。
      </p>
      <ElectionTable candidates={MAYORAL_ELECTION.candidates} />
      <h3 className="mt-2 flex items-center gap-1.5 text-sm font-bold text-mirai-text">
        <Vote aria-hidden className="size-4 text-primary-accent" />
        同日の市議会議員補欠選挙（欠員{COUNCIL_BY_ELECTION.seats}）
      </h3>
      <ElectionTable candidates={COUNCIL_BY_ELECTION.candidates} />
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

interface ElectionTableProps {
  candidates: readonly ElectionCandidate[];
}

function ElectionTable({ candidates }: ElectionTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-mirai-border-muted">
      <table className="w-full min-w-[320px] text-sm">
        <thead className="bg-mirai-surface text-xs text-mirai-text-secondary">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-bold">
              候補者
            </th>
            <th scope="col" className="px-3 py-2 text-left font-bold">
              新旧
            </th>
            <th scope="col" className="px-3 py-2 text-right font-bold">
              得票
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-mirai-border-muted">
          {candidates.map((candidate) => (
            <tr
              key={candidate.name}
              className={candidate.elected ? "bg-mirai-surface-key-subtle" : ""}
            >
              <td className="px-3 py-2.5 font-bold text-mirai-text">
                {candidate.elected && (
                  <span className="mr-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] text-white">
                    当選
                  </span>
                )}
                {candidate.name}
              </td>
              <td className="px-3 py-2.5 text-mirai-text-secondary">
                {STATUS_LABELS[candidate.status]}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-mirai-text">
                {numberFormat.format(candidate.votes)}票
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
