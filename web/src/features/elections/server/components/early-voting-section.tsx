import { TextLink } from "@/components/ui/text-link";
import { MAYORAL_ELECTION } from "@/features/mayor/shared/data/mayor-profile";
import {
  MAYOR_ELECTION_2026_DAY_PROGRESS,
  POLLING_HOURS_POLICY,
} from "../../shared/data/turnout-data";
import {
  electionDayVotersAfter,
  formatClockTime,
  formatPeople,
  formatPercent,
  formatTimeRange,
  sharePercent,
  type TurnoutBreakdown,
} from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";
import {
  BarGroupRow,
  ChartFigure,
  type ChartSeries,
  type MeterItem,
  MeterList,
} from "./turnout-bars";
import { TurnoutSection } from "./turnout-section";

const DAY_SERIES: readonly ChartSeries[] = [
  { label: "当日に投票した人の累計", kind: "focus" },
];

const { electionDay, earlyVoting } = POLLING_HOURS_POLICY;

/** 令和8年7月の選挙で当日投票所を閉じた時刻の行の名前（「20時（終了）」） */
const CLOSING_ROW_LABEL = `${formatClockTime(electionDay.closesBefore)}（終了）`;

/** 当日に投票所で投票した人の累計（令和8年7月12日の速報と結了の値） */
function DayProgressChart({ finalDayVoters }: { finalDayVoters: number }) {
  const rows = [
    ...MAYOR_ELECTION_2026_DAY_PROGRESS.map((point) => ({
      label: formatClockTime(point.time),
      voters: point.voters,
    })),
    { label: CLOSING_ROW_LABEL, voters: finalDayVoters },
  ];
  return (
    <ChartFigure
      title="当日に投票した人の累計（市長選挙）"
      note={
        <>
          {CLOSING_ROW_LABEL}
          の人数は選挙管理委員会の集計用紙の当日投票者数、それ以外は市の
          <TextLink external href={MAYORAL_ELECTION.sourceUrl} className="mx-1">
            投・開票速報
          </TextLink>
          の値です。
        </>
      }
    >
      {rows.map((row) => (
        <BarGroupRow
          key={row.label}
          label={row.label}
          series={DAY_SERIES}
          values={[row.voters]}
          max={finalDayVoters}
          format={formatPeople}
        />
      ))}
    </ChartFigure>
  );
}

/** 選挙管理委員会が決めた、当日投票所の開設時間を短くする方針 */
function PollingHoursNotice() {
  const before = formatTimeRange(electionDay.opens, electionDay.closesBefore);
  const after = formatTimeRange(electionDay.opens, electionDay.closesAfter);
  const early = formatTimeRange(earlyVoting.opens, earlyVoting.closes);
  const text = `市の選挙管理委員会は${POLLING_HOURS_POLICY.decidedAt}、選挙当日の投票所の開設時間を「${before}」から「${after}」に短くする方針を決めました。投票立会人の負担を減らすためとしています。期日前投票所は${early}（変更なし）です。`;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-mirai-surface-key-subtle px-4 py-3.5 text-sm leading-relaxed text-mirai-text">
      <p className="font-bold">当日の投票時間を短くする方針</p>
      <p>{text}</p>
      <TextLink
        external
        href={POLLING_HOURS_POLICY.sourceUrl}
        className="text-xs"
      >
        出典: 田川市選挙管理委員会の方針
      </TextLink>
    </div>
  );
}

interface EarlyVotingSectionProps {
  current: TurnoutBreakdown;
  previous: TurnoutBreakdown;
  currentLabel: string;
  previousLabel: string;
}

/**
 * 期日前投票の割合と、当日の投票が時刻ごとにどう積み上がったか。
 * 当日の速報と投票時間の方針は令和8年7月の選挙のもの
 */
export function EarlyVotingSection({
  current,
  previous,
  currentLabel,
  previousLabel,
}: EarlyVotingSectionProps) {
  const finalDayVoters = current.electionDay.total;
  // 方針の閉鎖時刻（18時）より後に、当日の投票所で投票した人
  const lateVoters = electionDayVotersAfter(
    MAYOR_ELECTION_2026_DAY_PROGRESS,
    electionDay.closesAfter,
    finalDayVoters
  );
  const earlyItems: MeterItem[] = [
    { label: currentLabel, breakdown: current },
    { label: previousLabel, breakdown: previous },
  ].map(({ label, breakdown }) => ({
    id: label,
    label,
    percent: breakdown.earlyShare,
    note: `期日前投票 ${formatPeople(breakdown.early.total)} ／ 投票した人 ${formatPeople(breakdown.voters.total)}`,
  }));
  const lateVotersText = `当日に投票所で投票した人の累計です（期日前投票と不在者投票は含みません）。${formatClockTime(electionDay.closesAfter)}より後に投票した人は${formatPeople(lateVoters)}で、投票した人全体の${formatPercent(sharePercent(lateVoters, current.voters.total))}、当日に投票した人の${formatPercent(sharePercent(lateVoters, finalDayVoters))}でした。`;

  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.early.id}
      title="期日前投票と当日の投票"
      description="投票した人のうち、期日前投票をした人の割合です"
    >
      <MeterList items={earlyItems} />

      <h3 className="mt-2 text-base font-bold text-mirai-text">
        当日（7月12日）の投票の進み方
      </h3>
      <p className="text-sm leading-relaxed text-mirai-text">
        {lateVotersText}
      </p>
      <DayProgressChart finalDayVoters={finalDayVoters} />
      <PollingHoursNotice />
    </TurnoutSection>
  );
}
