import type { ReactNode } from "react";
import { barWidthPercent } from "@/features/bills/shared/utils/budget-chart";
import { cn } from "@/lib/utils";
import { formatPercent } from "../../shared/utils/turnout";

/**
 * 投票率ページのグラフ部品。
 * 値は必ず文字でも並べ、棒は装飾（aria-hidden）にする。色は2つだけ:
 * 注目する系列はキーカラー（bg-primary）、比べるための系列は灰色（bg-mirai-text-placeholder）
 */
const SERIES_CLASS = {
  focus: "bg-primary",
  context: "bg-mirai-text-placeholder",
} as const;

export interface ChartSeries {
  label: string;
  kind: keyof typeof SERIES_CLASS;
}

/** 凡例。色の四角の横に、本文と同じ文字色で系列名を書く */
function ChartLegend({ series }: { series: readonly ChartSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mirai-text-secondary">
      {series.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              "size-3 shrink-0 rounded-sm",
              SERIES_CLASS[item.kind]
            )}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

interface ChartFigureProps {
  title: string;
  /** 2系列以上のときだけ凡例を出す */
  series?: readonly ChartSeries[];
  note: ReactNode;
  children: ReactNode;
}

/** グラフの枠: 見出し・凡例・行・注記 */
export function ChartFigure({
  title,
  series,
  note,
  children,
}: ChartFigureProps) {
  return (
    <figure className="flex flex-col gap-4 rounded-lg border border-mirai-border-muted bg-white p-4 md:p-5">
      <figcaption className="flex flex-col gap-2">
        <span className="text-sm font-bold text-mirai-text">{title}</span>
        {series && series.length > 1 && <ChartLegend series={series} />}
      </figcaption>
      <div className="flex flex-col gap-3">{children}</div>
      <p className="text-xs leading-relaxed text-mirai-text-muted">{note}</p>
    </figure>
  );
}

interface BarGroupRowProps {
  label: string;
  /** ラベルの下に小さく添える説明 */
  sublabel?: string;
  series: readonly ChartSeries[];
  /** series と同じ順の値 */
  values: readonly number[];
  max: number;
  format: (value: number) => string;
}

/**
 * 1つの区分に系列の数だけ棒を並べる行。基線（左）は角を立て、値の端だけ丸める。
 * ツールチップ（title）には区分名・系列名・値を、読み上げ用の文には系列名と値を入れる
 */
export function BarGroupRow({
  label,
  sublabel,
  series,
  values,
  max,
  format,
}: BarGroupRowProps) {
  // map に format をそのまま渡すと、2番目の引数（添字）が桁数として渡ってしまう
  const texts = values.map((value) => format(value));
  // 区分名は見えるラベルで読み上げられるので、読み上げ用の文は系列名と値だけにする
  const valuesText = series
    .map((item, i) => `${item.label} ${texts[i]}`)
    .join("、");
  return (
    <div
      title={`${label}: ${valuesText}`}
      className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[7rem_minmax(0,1fr)]"
    >
      <span className="flex flex-col text-sm leading-snug text-mirai-text">
        {label}
        {sublabel && (
          <span className="text-xs text-mirai-text-muted">{sublabel}</span>
        )}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="sr-only">{valuesText}</span>
        {series.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div aria-hidden className="h-3 min-w-0 flex-1">
              <div
                className={cn("h-full rounded-r", SERIES_CLASS[item.kind])}
                style={{ width: `${barWidthPercent(values[i], max)}%` }}
              />
            </div>
            <span
              aria-hidden
              className={cn(
                "w-14 shrink-0 text-right text-xs tabular-nums",
                item.kind === "focus"
                  ? "font-bold text-mirai-text"
                  : "text-mirai-text-muted"
              )}
            >
              {texts[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MeterProps {
  label: string;
  /** 0〜100 */
  percent: number;
  /** 割合の小数の桁数 */
  digits?: number;
  note?: ReactNode;
}

/** 割合を1本のメーターで見せる。空き部分はキーカラーの薄い面 */
export function Meter({ label, percent, digits = 1, note }: MeterProps) {
  const valueText = formatPercent(percent, digits);
  return (
    <div className="flex flex-col gap-1.5" title={`${label}: ${valueText}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium text-mirai-text">{label}</span>
        <span className="whitespace-nowrap font-bold tabular-nums text-mirai-text">
          {valueText}
        </span>
      </div>
      <div
        aria-hidden
        className="h-3 w-full overflow-hidden rounded bg-mirai-surface-key"
      >
        <div
          className={cn("h-full rounded-r", SERIES_CLASS.focus)}
          style={{ width: `${barWidthPercent(percent, 100)}%` }}
        />
      </div>
      {note && <div className="text-xs text-mirai-text-muted">{note}</div>}
    </div>
  );
}

export interface MeterItem extends MeterProps {
  /** React の key（Meter には渡さない） */
  id: string;
}

/** メーターを罫線で区切って縦に並べるカード */
export function MeterList({ items }: { items: readonly MeterItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-mirai-border-muted rounded-lg border border-mirai-border-muted bg-white px-4">
      {items.map(({ id, ...meter }) => (
        <li key={id} className="py-3">
          <Meter {...meter} />
        </li>
      ))}
    </ul>
  );
}
