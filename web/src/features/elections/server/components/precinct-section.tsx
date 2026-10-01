import { TextLink } from "@/components/ui/text-link";
import {
  POLLING_HOURS_POLICY,
  POLLING_PLACES_2026,
  POLLING_PLACES_SOURCE_URL,
} from "../../shared/data/turnout-data";
import {
  extremesBy,
  formatPeople,
  formatPercent,
  type PrecinctTurnout,
} from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";
import { MeterList } from "./turnout-bars";
import { TurnoutSection } from "./turnout-section";

/** 投票所の名前と人数。人数の塊ごとに折り返し、数字の途中では折れないようにする */
function PrecinctNote({ row }: { row: PrecinctTurnout }) {
  const place = POLLING_PLACES_2026[row.precinct];
  return (
    <div className="flex flex-col gap-0.5">
      {place && <span>{place}</span>}
      <span className="flex flex-wrap gap-x-2">
        <span className="whitespace-nowrap">
          有権者 {formatPeople(row.electorate.total)}
        </span>
        <span className="whitespace-nowrap">
          投票した人 {formatPeople(row.voters.total)}
        </span>
        <span className="whitespace-nowrap">
          うち期日前 {formatPercent(row.earlyShare)}
        </span>
      </span>
    </div>
  );
}

interface PrecinctSectionProps {
  /** 令和8年7月の選挙の15投票区（投票所の名前は POLLING_PLACES_2026 から引く） */
  precincts: readonly PrecinctTurnout[];
  electionLabel: string;
}

/** 投票区ごとの投票率。投票区の番号順に並べ、順位づけはしない */
export function PrecinctSection({
  precincts,
  electionLabel,
}: PrecinctSectionProps) {
  const rateRange = extremesBy(precincts, (row) => row.rate.total);
  const earlyRange = extremesBy(precincts, (row) => row.earlyShare);
  const summary = `投票区によって${formatPercent(rateRange.min.rate.total)}から${formatPercent(rateRange.max.rate.total)}まで差がありました。投票した人のうち期日前投票をした人の割合も、${formatPercent(earlyRange.min.earlyShare)}から${formatPercent(earlyRange.max.earlyShare)}まで幅があります。`;

  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.precincts.id}
      title="投票区ごとの投票率"
      description={`${electionLabel}。投票区の番号順です`}
    >
      <p className="text-sm leading-relaxed text-mirai-text">{summary}</p>
      <MeterList
        items={precincts.map((row) => ({
          id: String(row.precinct),
          label: `第${row.precinct}投票区`,
          percent: row.rate.total,
          note: <PrecinctNote row={row} />,
        }))}
      />
      {/* リンクは文中に置くと「（」だけが行末に残る折り返しになるため、出典として行を分ける */}
      <div className="flex flex-col gap-1.5 text-xs leading-relaxed text-mirai-text-muted">
        <p>
          投票区は小学校区を単位に再編され、令和5年の20区から15区になりました。区域が変わったため、令和5年との投票区ごとの比較はしていません。投票所の名前は令和8年9月1日現在の予定施設です。
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <TextLink external href={POLLING_HOURS_POLICY.sourceUrl}>
            出典: 投票区の再編（市選挙管理委員会の方針）
          </TextLink>
          <TextLink external href={POLLING_PLACES_SOURCE_URL}>
            出典: 投票所の一覧
          </TextLink>
        </p>
      </div>
    </TurnoutSection>
  );
}
