import { COUNCIL_ELECTION_HISTORY } from "../../shared/data/turnout-data";
import { formatPeople } from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";
import { MeterList } from "./turnout-bars";
import { TurnoutSection } from "./turnout-section";

/** 市議会議員選挙の投票率と期日前投票者数の移り変わり */
export function HistorySection() {
  return (
    <TurnoutSection
      id={TURNOUT_SECTIONS.history.id}
      title="市議会議員選挙の投票率の推移"
      description="4年ごとの一般選挙と、令和8年7月の補欠選挙です"
    >
      <MeterList
        items={COUNCIL_ELECTION_HISTORY.map((row) => {
          const sameDay = row.heldWith ? `（${row.heldWith}と同じ日）` : "";
          return {
            id: row.date,
            label: row.label,
            percent: row.rate.total,
            digits: 2,
            note: `期日前投票 ${formatPeople(row.earlyVoters)}${sameDay}`,
          };
        })}
      />
      <p className="text-xs leading-relaxed text-mirai-text-muted">
        補欠選挙は欠員を埋めるための選挙で、時期も事情も一般選挙と違うため、単純には比べられません。
      </p>
    </TurnoutSection>
  );
}
