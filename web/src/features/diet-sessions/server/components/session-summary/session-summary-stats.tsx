import type { SessionResultsSummary } from "../../../shared/utils/session-summary";

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-mirai-text-placeholder bg-white px-4 py-5 text-center">
      <span className="text-3xl font-bold text-mirai-text">{value}</span>
      <span className="text-xs font-medium text-mirai-text-muted">{label}</span>
    </div>
  );
}

interface SessionSummaryStatsProps {
  summary: SessionResultsSummary;
}

/**
 * 「数字でみるこの会期」セクション。提出件数・結果内訳・賛否が分かれた
 * 案件数をカード型の統計表示で見せる
 */
export function SessionSummaryStats({ summary }: SessionSummaryStatsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
        数字でみるこの会期
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="提出議案" value={summary.total} />
        <StatCard label="可決・同意・承認・認定など" value={summary.passed} />
        <StatCard label="否決・不認定・不採択" value={summary.rejected} />
        <StatCard label="賛否が分かれた案件" value={summary.splitCount} />
      </div>
      {summary.other > 0 && (
        <p className="text-xs text-mirai-text-muted">
          ※ 継続審議など、上記以外の結果の議案が{summary.other}件あります
        </p>
      )}
    </section>
  );
}
