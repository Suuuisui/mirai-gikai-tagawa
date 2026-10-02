import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SourceNote } from "@/components/ui/source-note";
import { TextLink } from "@/components/ui/text-link";
import { MAYORAL_ELECTION } from "@/features/mayor/shared/data/mayor-profile";
import { routes } from "@/lib/routes";
import { AgeTurnoutExplorer } from "../../client/components/age-turnout-explorer";
import {
  COUNCIL_BY_ELECTION_2026,
  COUNCIL_ELECTION_2023,
  MAYOR_ELECTION_2026,
} from "../../shared/data/turnout-data";
import { summarizeAges, summarizeElection } from "../../shared/utils/turnout";
import { AgeBandSection, AgeCompositionSection } from "./age-sections";
import { AgeVotesSection } from "./age-votes-section";
import { EarlyVotingSection } from "./early-voting-section";
import { HistorySection } from "./history-section";
import { PrecinctSection } from "./precinct-section";
import { TURNOUT_SECTIONS } from "./section-ids";
import { TurnoutHero } from "./turnout-hero";
import { TurnoutSection } from "./turnout-section";

/** ページ末尾の出典と注意書き */
function TurnoutSourceNote() {
  return (
    <SourceNote>
      令和8年7月の市長選挙・市議会議員補欠選挙と令和5年4月の市議会議員一般選挙の数字は、田川市選挙管理委員会の「投票結果速報集計用紙（結了報告）」と「年代別
      投票者数・投票率」を転記したものです（令和8年9月24日付の情報開示請求に対し、令和8年10月に交付を受けた文書）。投票率は、投票した人の数を選挙当日の有権者数で割ったものです。それ以前の選挙の投票率と期日前投票者数は、同じ集計用紙の欄外に載っている値です。当日の時刻ごとの人数は市の
      <TextLink external href={MAYORAL_ELECTION.sourceUrl} className="mx-1">
        投・開票速報
      </TextLink>
      によります。このページは選挙への参加を考えるための資料で、特定の地域や世代を評価するものではありません。候補者ごとの得票は
      <TextLink href={routes.mayor()} className="mx-1">
        新市長のページ
      </TextLink>
      にあります。
    </SourceNote>
  );
}

/**
 * 選挙の投票率ページ（/elections）。
 * 令和8年7月の市長選挙を主に、令和5年4月の市議会議員選挙を比較に使う。
 * 「誰の参加が少ないか」を責める見せ方にせず、事実と制度（期日前投票・投票時間）を並べる
 */
export function ElectionTurnoutPage() {
  const mayor = summarizeElection(MAYOR_ELECTION_2026.precincts);
  const council2023 = summarizeElection(COUNCIL_ELECTION_2023.precincts);
  const byElection = summarizeElection(COUNCIL_BY_ELECTION_2026.precincts);
  const mayorAges = summarizeAges(MAYOR_ELECTION_2026.ages);
  const council2023Ages = summarizeAges(COUNCIL_ELECTION_2023.ages);
  const currentLabel = MAYOR_ELECTION_2026.shortName;
  const previousLabel = COUNCIL_ELECTION_2023.shortName;

  return (
    <div data-wide-column>
      <TurnoutHero
        mayor={mayor.total}
        byElectionRate={byElection.total.rate.total}
      />

      <Container className="py-8">
        <div className="flex flex-col gap-12">
          <TurnoutSection
            id={TURNOUT_SECTIONS.myAge.id}
            title="あなたと同じ年齢の人は、どれくらい投票した？"
            description={`年齢と性別を選ぶと、${currentLabel}の投票率が出ます`}
          >
            <AgeTurnoutExplorer
              current={MAYOR_ELECTION_2026.ages}
              previous={COUNCIL_ELECTION_2023.ages}
              currentLabel={currentLabel}
              previousLabel={previousLabel}
              overallRate={mayor.total.rate.total}
            />
          </TurnoutSection>

          <AgeBandSection
            currentAges={mayorAges}
            previousAges={council2023Ages}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
          />

          <AgeVotesSection ages={mayorAges} electionLabel={currentLabel} />

          <AgeCompositionSection
            ages={mayorAges}
            electionLabel={currentLabel}
          />

          <EarlyVotingSection
            current={mayor.total}
            previous={council2023.total}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
          />

          <PrecinctSection
            precincts={mayor.precincts}
            electionLabel={currentLabel}
          />

          <HistorySection />

          <TurnoutSourceNote />
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "選挙の投票率" },
          ]}
        />
      </Container>
    </div>
  );
}
