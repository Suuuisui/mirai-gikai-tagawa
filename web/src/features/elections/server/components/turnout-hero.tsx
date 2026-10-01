import { Container } from "@/components/layouts/container";
import { JumpNav } from "@/components/ui/jump-nav";
import {
  formatCount,
  formatPeople,
  formatPercent,
  type TurnoutBreakdown,
} from "../../shared/utils/turnout";
import { TURNOUT_SECTIONS } from "./section-ids";

const JUMP_ENTRIES = Object.values(TURNOUT_SECTIONS).map((section) => ({
  label: section.navLabel,
  href: `#${section.id}`,
}));

const HERO_DESCRIPTION =
  "令和8年7月12日の田川市長選挙を中心に、年代別・投票区別の投票率と、これまでの市議会議員選挙からの移り変わりをまとめました。市の選挙管理委員会に情報開示請求をして入手した資料をもとにしています。";

interface TurnoutHeroProps {
  /** 令和8年7月の市長選挙の全体の集計 */
  mayor: TurnoutBreakdown;
  /** 同じ日の市議会議員補欠選挙の投票率 */
  byElectionRate: number;
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-mirai-surface-key-subtle px-4 py-3">
      <dt className="text-xs text-mirai-text-muted">{label}</dt>
      <dd className="text-xl font-bold text-mirai-text">{value}</dd>
      {note && <dd className="text-xs text-mirai-text-muted">{note}</dd>}
    </div>
  );
}

/** ページ冒頭: 見出し、市長選挙の投票率、要点の数字、ページ内ジャンプ */
export function TurnoutHero({ mayor, byElectionRate }: TurnoutHeroProps) {
  return (
    <div className="bg-mirai-surface-key md:rounded-lg">
      <Container className="flex flex-col gap-5 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-mirai-text">選挙の投票率</h1>
          <p className="text-sm leading-relaxed text-mirai-text-secondary">
            {HERO_DESCRIPTION}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-white p-5">
          <p className="text-sm font-bold text-mirai-text-secondary">
            令和8年7月12日 田川市長選挙の投票率
          </p>
          <p className="text-6xl font-bold leading-none text-mirai-text">
            {formatPercent(mayor.rate.total, 2)}
          </p>
          <p className="text-sm leading-relaxed text-mirai-text">
            有権者{formatCount(mayor.electorate.total)}人のうち
            {formatCount(mayor.voters.total)}
            人が投票しました。同じ日の市議会議員補欠選挙は
            {formatPercent(byElectionRate, 2)}でした。
          </p>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat label="投票した人" value={formatPeople(mayor.voters.total)} />
            <Stat
              label="投票しなかった人"
              value={formatPeople(mayor.abstained.total)}
            />
            <Stat
              label="期日前投票をした人"
              value={formatPeople(mayor.early.total)}
              note={`投票した人の${formatPercent(mayor.earlyShare)}`}
            />
          </dl>
        </div>

        <JumpNav entries={JUMP_ENTRIES} />
      </Container>
    </div>
  );
}
