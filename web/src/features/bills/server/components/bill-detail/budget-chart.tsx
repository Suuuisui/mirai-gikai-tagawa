import {
  type BudgetChartBreakdown,
  type BudgetChartTotal,
  barWidthPercent,
  formatSignedYen,
  formatYen,
  parseBudgetChartSpec,
} from "../../../shared/utils/budget-chart";

interface BudgetChartProps {
  /** ```budget-chart コードブロックの JSON（rehype-budget-chart.ts が渡す） */
  spec: string;
}

interface BarRowProps {
  label: string;
  amount: number;
  /** 棒の長さの基準（この値で 100%） */
  max: number;
  /** 増減として表示する（＋/△ を付ける） */
  signed?: boolean;
  note?: string;
}

/**
 * 1行分の棒。金額はテキストでも読めるようにし、棒自体は装飾扱い。
 * 議案本文（.markdown-content）の ul / li / p 向けのスタイルを受けないよう、
 * 要素は div と span だけで組む
 */
function BarRow({ label, amount, max, signed = false, note }: BarRowProps) {
  const negative = amount < 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium text-mirai-text">{label}</span>
        <span
          className={
            negative
              ? "whitespace-nowrap tabular-nums text-mirai-text-muted"
              : "whitespace-nowrap tabular-nums text-mirai-text"
          }
        >
          {signed ? formatSignedYen(amount) : formatYen(amount)}
        </span>
      </div>
      <div
        aria-hidden
        className="h-2.5 w-full overflow-hidden rounded-full bg-mirai-progress-track"
      >
        <div
          className={
            negative
              ? "h-full rounded-full bg-mirai-text-muted"
              : "h-full rounded-full bg-primary"
          }
          style={{ width: `${barWidthPercent(amount, max)}%` }}
        />
      </div>
      {note && <span className="text-xs text-mirai-text-muted">{note}</span>}
    </div>
  );
}

/** 予算総額が補正でどう変わるか（補正前 → 今回の補正 → 補正後） */
function TotalChart({ total }: { total: BudgetChartTotal }) {
  const max = Math.max(Math.abs(total.before), Math.abs(total.after));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-mirai-text">
        {total.label ?? "予算の総額"}はどう変わるか
      </span>
      <div className="flex flex-col gap-2.5">
        <BarRow label="補正前" amount={total.before} max={max} />
        <BarRow label="今回の補正" amount={total.change} max={max} signed />
        <BarRow label="補正後" amount={total.after} max={max} />
      </div>
    </div>
  );
}

function BreakdownChart({ breakdown }: { breakdown: BudgetChartBreakdown }) {
  const max = Math.max(...breakdown.items.map((item) => Math.abs(item.amount)));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-mirai-text">
        {breakdown.title}
      </span>
      {breakdown.note && (
        <span className="text-xs text-mirai-text-muted">{breakdown.note}</span>
      )}
      <div className="flex flex-col gap-2.5">
        {breakdown.items.map((item, index) => (
          <BarRow
            key={`${index}-${item.label}`}
            label={item.label}
            amount={item.amount}
            max={max}
            signed
            note={item.note}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 解説文の ```budget-chart ブロックを描く図。
 * 金額の並びを棒の長さで見せ、数字は億・万・円で添える。
 * 装飾用の棒には aria-hidden を付け、読み上げでは見出しと金額だけを読む。
 * break-normal は本文の section に付く break-all（数字の途中で折り返す）を打ち消す
 */
export function BudgetChart({ spec }: BudgetChartProps) {
  const chart = parseBudgetChartSpec(spec);
  if (!chart) return null;
  return (
    <figure className="my-6 flex flex-col gap-5 break-normal rounded-lg border border-mirai-border-muted bg-mirai-surface-key-subtle p-4 md:p-5">
      {chart.title && (
        <figcaption className="text-base font-bold text-mirai-text">
          {chart.title}
        </figcaption>
      )}
      {chart.total && <TotalChart total={chart.total} />}
      {chart.breakdowns?.map((breakdown, index) => (
        <BreakdownChart
          key={`${index}-${breakdown.title}`}
          breakdown={breakdown}
        />
      ))}
      {chart.note && (
        <span className="text-xs leading-relaxed text-mirai-text-note">
          {chart.note}
        </span>
      )}
    </figure>
  );
}
