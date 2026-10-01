import {
  type AgeTurnout,
  ageComposition,
  ageLabel,
  axisMax,
  compareAgeBands,
  countAgesWomenAhead,
  extremesBy,
  formatCount,
  formatPercent,
  formatPointDiff,
  type TurnoutFigures,
} from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";
import { BarGroupRow, ChartFigure, type ChartSeries } from "./turnout-bars";
import { TurnoutSection } from "./turnout-section";

type BandComparison = ReturnType<typeof compareAgeBands>[number];

/** 表の1セル: 投票率（太字）と「投票した人 / 有権者」 */
function TurnoutCell({
  figures,
  className,
}: {
  figures: TurnoutFigures;
  className: string;
}) {
  return (
    <td className={className}>
      <span className="font-bold">{formatPercent(figures.rate.total, 2)}</span>
      <span className="ml-2 text-mirai-text-muted">
        {formatCount(figures.voters.total)} /{" "}
        {formatCount(figures.electorate.total)}人
      </span>
    </td>
  );
}

/** 5歳ごとの値を表で見せる（グラフの値を数字で確かめられるように） */
function AgeBandTable({
  rows,
  currentLabel,
  previousLabel,
}: {
  rows: readonly BandComparison[];
  currentLabel: string;
  previousLabel: string;
}) {
  return (
    <details className="rounded-lg border border-mirai-border-muted bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-mirai-text">
        表で見る（投票した人の数と有権者の数）
      </summary>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full min-w-[30rem] text-left text-xs tabular-nums">
          <thead className="text-mirai-text-muted">
            <tr className="border-b border-mirai-border-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                年代
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                {currentLabel}
              </th>
              <th scope="col" className="py-2 font-medium">
                {previousLabel}
              </th>
            </tr>
          </thead>
          <tbody className="text-mirai-text">
            {rows.map((row) => (
              <tr
                key={row.band.label}
                className="border-b border-mirai-border-muted last:border-b-0"
              >
                <th scope="row" className="py-2 pr-3 font-medium">
                  {row.band.label}
                </th>
                <TurnoutCell figures={row.current} className="py-2 pr-3" />
                <TurnoutCell figures={row.previous} className="py-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

interface AgeBandSectionProps {
  currentAges: readonly AgeTurnout[];
  previousAges: readonly AgeTurnout[];
  currentLabel: string;
  previousLabel: string;
}

/** 5歳ごとの投票率を、令和8年7月（注目）と令和5年4月（比較）の2本の棒で並べる */
export function AgeBandSection({
  currentAges,
  previousAges,
  currentLabel,
  previousLabel,
}: AgeBandSectionProps) {
  const rows = compareAgeBands(currentAges, previousAges);
  const bandExtremes = extremesBy(rows, (row) => row.current.rate.total);
  const ageExtremes = extremesBy(currentAges, (row) => row.rate.total);
  // 差は負の値なので、最小（min）が最も下がった帯、最大（max）が最も下がらなかった帯
  const diffExtremes = extremesBy(rows, (row) => row.diff);
  const allLower = rows.every((row) => row.diff < 0);
  const womenAhead = countAgesWomenAhead(currentAges);
  const series: readonly ChartSeries[] = [
    { label: currentLabel, kind: "focus" },
    { label: previousLabel, kind: "context" },
  ];

  const lowHigh = `最も低かったのは${bandExtremes.min.band.label}（${formatPercent(bandExtremes.min.current.rate.total)}）、最も高かったのは${bandExtremes.max.band.label}（${formatPercent(bandExtremes.max.current.rate.total)}）でした。1歳ごとに見ると、最も低いのは${ageLabel(ageExtremes.min.age)}（${formatPercent(ageExtremes.min.rate.total)}）、最も高いのは${ageLabel(ageExtremes.max.age)}（${formatPercent(ageExtremes.max.rate.total)}）です。`;
  const comparison = `どの年代も${previousLabel}より低く、差が大きかったのは${diffExtremes.min.band.label}（${formatPointDiff(diffExtremes.min.diff)}）、小さかったのは${diffExtremes.max.band.label}（${formatPointDiff(diffExtremes.max.diff)}）でした。選挙の種類も時期も違うため、単純には比べられません。`;
  const women = `${currentAges.length}の年齢区分のうち${womenAhead}で、女性の投票率が男性を上回りました。`;

  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.ageBands.id}
      title="年代別の投票率"
      description={`5歳ごとの投票率です。${previousLabel}と並べています`}
    >
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-mirai-text">
        <li>{lowHigh}</li>
        {allLower && <li>{comparison}</li>}
        <li>{women}</li>
      </ul>

      <ChartFigure
        title="年代別の投票率"
        series={series}
        note="棒の長さは0〜100%で表しています。18・19歳には、資料で「19未満」となっている18歳を含みます。"
      >
        {rows.map((row) => (
          <BarGroupRow
            key={row.band.label}
            label={row.band.label}
            series={series}
            values={[row.current.rate.total, row.previous.rate.total]}
            max={100}
            format={formatPercent}
          />
        ))}
      </ChartFigure>

      <AgeBandTable
        rows={rows}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
      />
    </TurnoutSection>
  );
}

const COMPOSITION_SERIES: readonly ChartSeries[] = [
  { label: "有権者に占める割合", kind: "context" },
  { label: "投票した人に占める割合", kind: "focus" },
];

interface AgeCompositionSectionProps {
  ages: readonly AgeTurnout[];
  electionLabel: string;
}

/** 有権者の年代構成と、投票した人の年代構成を比べる */
export function AgeCompositionSection({
  ages,
  electionLabel,
}: AgeCompositionSectionProps) {
  const rows = ageComposition(ages);
  const youngest = rows[0];
  const oldest = rows[rows.length - 1];
  const scaleMax = axisMax(
    rows.flatMap((row) => [row.electorateShare, row.votersShare])
  );
  // 大小を前提にした言い回しにせず、両方の割合を並べるだけにする
  const summary = `${youngest.band.label}は有権者の${formatPercent(youngest.electorateShare)}、投票した人の${formatPercent(youngest.votersShare)}でした。${oldest.band.label}は有権者の${formatPercent(oldest.electorateShare)}、投票した人の${formatPercent(oldest.votersShare)}です。`;

  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.composition.id}
      title="投票した人の年代"
      description="有権者全体に占める割合と、投票した人全体に占める割合を年代ごとに比べました"
    >
      <p className="text-sm leading-relaxed text-mirai-text">{summary}</p>
      <ChartFigure
        title={`年代ごとの割合（${electionLabel}）`}
        series={COMPOSITION_SERIES}
        note={`棒の長さは0〜${scaleMax}%で表しています。`}
      >
        {rows.map((row) => (
          <BarGroupRow
            key={row.band.label}
            label={row.band.label}
            sublabel={`投票率 ${formatPercent(row.rate)}`}
            series={COMPOSITION_SERIES}
            values={[row.electorateShare, row.votersShare]}
            max={scaleMax}
            format={formatPercent}
          />
        ))}
      </ChartFigure>
    </TurnoutSection>
  );
}
