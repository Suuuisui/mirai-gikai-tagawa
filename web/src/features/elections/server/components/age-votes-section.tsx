import {
  type AgeBandVotes,
  type AgeTurnout,
  ageLabel,
  axisMax,
  formatPeople,
  formatPercent,
  formatTimes,
  formatVotes,
  singleAgeVoteGap,
  sumTotal,
  votesByAgeBand,
} from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";
import { ChartFigure, type ChartSeries, StackedBarRow } from "./turnout-bars";
import { TurnoutSection } from "./turnout-section";

const VOTED: ChartSeries = { label: "投票した人（票の数）", kind: "focus" };
const ABSTAINED: ChartSeries = { label: "投票しなかった人", kind: "remainder" };
const VOTE_SERIES: readonly ChartSeries[] = [VOTED, ABSTAINED];

/** 棒の目盛りの刻み（人） */
const SCALE_STEP = 1000;

const MECHANISM =
  "選挙の結果は票の数で決まります。票の数は「その年代の有権者の数 × 投票率」なので、投票率が同じなら有権者の多い年代ほど票が多くなり、投票する人が増えればその年代の票も増えます。";

/** 1歳ごとの票の最少と最多を、有権者の数と投票率の違いに分けて説明する */
function describeSingleAgeGap(ages: readonly AgeTurnout[]): string {
  const { fewest, most, votesTimes, electorateTimes, rateTimes } =
    singleAgeVoteGap(ages);
  return `1歳ごとに見ると（1歳ごとの数が無い80歳以上は除きます）、票が最も少なかったのは${ageLabel(fewest.age)}の${formatVotes(fewest.voters.total)}、最も多かったのは${ageLabel(most.age)}の${formatVotes(most.voters.total)}で、約${formatTimes(votesTimes)}の開きがあります。有権者の数（${formatPeople(fewest.electorate.total)}と${formatPeople(most.electorate.total)}）で約${formatTimes(electorateTimes)}、投票率（${formatPercent(fewest.rate.total)}と${formatPercent(most.rate.total)}）で約${formatTimes(rateTimes)}の違いがあり、その2つが重なった開きです。`;
}

/** 5歳ごとの票の数を表で見せる（グラフの値を数字で確かめられるように） */
function AgeVotesTable({
  rows,
  votersTotal,
  electorateTotal,
}: {
  rows: readonly AgeBandVotes[];
  votersTotal: number;
  electorateTotal: number;
}) {
  return (
    <details className="rounded-lg border border-mirai-border-muted bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-mirai-text">
        表で見る（票の数と、票全体に占める割合）
      </summary>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full min-w-[30rem] text-xs tabular-nums">
          <thead className="text-mirai-text-muted">
            <tr className="border-b border-mirai-border-muted">
              <th scope="col" className="py-2 pr-3 text-left font-medium">
                年代
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                票の数
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                票全体に占める割合
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                投票しなかった人
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                有権者
              </th>
            </tr>
          </thead>
          <tbody className="text-mirai-text">
            {rows.map((row) => (
              <tr
                key={row.band.label}
                className="border-b border-mirai-border-muted"
              >
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {row.band.label}
                </th>
                <td className="py-2 pr-3 text-right font-bold">
                  {formatVotes(row.voters)}
                </td>
                <td className="py-2 pr-3 text-right">
                  {formatPercent(row.votersShare)}
                </td>
                <td className="py-2 pr-3 text-right text-mirai-text-muted">
                  {formatPeople(row.abstained)}
                </td>
                <td className="py-2 text-right text-mirai-text-muted">
                  {formatPeople(row.electorate)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-mirai-text">
            <tr>
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                計
              </th>
              <td className="py-2 pr-3 text-right font-bold">
                {formatVotes(votersTotal)}
              </td>
              <td className="py-2 pr-3 text-right">{formatPercent(100)}</td>
              <td className="py-2 pr-3 text-right text-mirai-text-muted">
                {formatPeople(electorateTotal - votersTotal)}
              </td>
              <td className="py-2 text-right text-mirai-text-muted">
                {formatPeople(electorateTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}

interface AgeVotesSectionProps {
  ages: readonly AgeTurnout[];
  electionLabel: string;
}

/**
 * 年代別の票の数（投票した人の数）。投票率はその年代の中の割合で、選挙の結果を左右するのは票の数。
 * 有権者を「投票した人」と「投票しなかった人」に分けた積み上げ棒で、票の数と有権者の数を一緒に見せる。
 * 年代を評価する言い回しにせず、票の数が有権者の数と投票率の両方で決まることを淡々と示す
 */
export function AgeVotesSection({ ages, electionLabel }: AgeVotesSectionProps) {
  const rows = votesByAgeBand(ages);
  const scaleMax = axisMax(
    rows.map((row) => row.electorate),
    SCALE_STEP
  );
  const votersTotal = sumTotal(ages, "voters");
  const electorateTotal = sumTotal(ages, "electorate");

  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.votes.id}
      title="年代別の票の数"
      description="年代ごとに、投票した人の数を並べました。1人1票なので、これがそのまま票の数です"
    >
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-mirai-text">
        <li>{MECHANISM}</li>
        <li>{describeSingleAgeGap(ages)}</li>
      </ul>

      <ChartFigure
        title={`5歳ごとの票の数（${electionLabel}）`}
        series={VOTE_SERIES}
        note={`棒全体の長さが有権者の数で、濃い青が投票した人（票の数）、明るい青が投票しなかった人です。棒の長さは0〜${formatPeople(scaleMax)}で表しています。18・19歳は2歳分、80歳以上は80歳から上をまとめた人数で、ほかは5歳分です。`}
      >
        {rows.map((row) => (
          <StackedBarRow
            key={row.band.label}
            label={row.band.label}
            sublabel={`有権者${formatPeople(row.electorate)}`}
            segments={[
              {
                series: VOTED,
                value: row.voters,
                text: formatVotes(row.voters),
              },
              {
                series: ABSTAINED,
                value: row.abstained,
                text: formatPeople(row.abstained),
              },
            ]}
            max={scaleMax}
          />
        ))}
      </ChartFigure>

      <AgeVotesTable
        rows={rows}
        votersTotal={votersTotal}
        electorateTotal={electorateTotal}
      />
    </TurnoutSection>
  );
}
