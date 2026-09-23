/**
 * 議案の解説文に埋め込む「予算の図解」の定義とお金の表記【田川市専用】
 *
 * 解説文（Markdown）の中に ```budget-chart というコードブロックで JSON を書くと、
 * rehype-budget-chart.ts が BudgetChart コンポーネントに置き換えて棒グラフにする。
 * 金額はすべて円の整数。マイナスは減額
 */

import { z } from "zod";

const amount = z.number().int().finite();

const itemSchema = z
  .object({
    label: z.string().min(1),
    /** 円。マイナスは減額 */
    amount,
    /** 一言の補足（例: 決算の確定による） */
    note: z.string().optional(),
  })
  .strict();

const breakdownSchema = z
  .object({
    /** 例: 歳出の内訳（どこに使うか） */
    title: z.string().min(1),
    note: z.string().optional(),
    items: z.array(itemSchema).min(1),
  })
  .strict();

const totalSchema = z
  .object({
    /** 例: 一般会計の予算総額 */
    label: z.string().optional(),
    before: amount,
    change: amount,
    after: amount,
  })
  .strict()
  // 補正前＋補正額＝補正後が合わない定義は、書き写しの誤りなので図にしない
  .refine((t) => t.before + t.change === t.after, {
    message: "before + change が after と一致しません",
  });

const specSchema = z
  .object({
    title: z.string().optional(),
    total: totalSchema.optional(),
    breakdowns: z.array(breakdownSchema).optional(),
    /** 図の下に添える注記 */
    note: z.string().optional(),
  })
  .strict()
  .refine((s) => s.total !== undefined || (s.breakdowns?.length ?? 0) > 0, {
    message: "total か breakdowns のどちらかが必要です",
  });

export type BudgetChartItem = z.infer<typeof itemSchema>;
export type BudgetChartBreakdown = z.infer<typeof breakdownSchema>;
export type BudgetChartTotal = z.infer<typeof totalSchema>;
export type BudgetChartSpec = z.infer<typeof specSchema>;

/**
 * コードブロックの JSON を図の定義として読む。JSON として読めない・形が違う
 * （知らないキーがある）・補正前＋補正額≠補正後の場合は null
 * （解説文の書き手が気づけるよう、呼び出し側はコードブロックをそのまま残す）
 */
export function parseBudgetChartSpec(json: string): BudgetChartSpec | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const result = specSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

const UNITS: Array<{ value: number; label: string }> = [
  { value: 1_0000_0000_0000, label: "兆" },
  { value: 1_0000_0000, label: "億" },
  { value: 1_0000, label: "万" },
];

/**
 * 円の整数を「367億464万5,000円」の形にする。
 * 予算書と同じ読み方（億・万・円）で、マイナスは予算書の慣例にならい「△」を付ける
 */
export function formatYen(amount: number): string {
  if (amount === 0) return "0円";
  const sign = amount < 0 ? "△" : "";
  let rest = Math.abs(amount);
  const parts: string[] = [];
  for (const unit of UNITS) {
    const count = Math.floor(rest / unit.value);
    if (count > 0) {
      parts.push(`${count.toLocaleString("ja-JP")}${unit.label}`);
      rest -= count * unit.value;
    }
  }
  if (rest > 0 || parts.length === 0) {
    parts.push(rest.toLocaleString("ja-JP"));
  }
  return `${sign}${parts.join("")}円`;
}

/** 増減を「＋3億9,502万2,000円」「△10万2,000円」の形にする */
export function formatSignedYen(amount: number): string {
  if (amount > 0) return `＋${formatYen(amount)}`;
  return formatYen(amount);
}

/** 棒の長さ（%、0〜100）。最大値に対する絶対値の割合で、小さすぎる値も見えるよう最低2% */
export function barWidthPercent(amount: number, max: number): number {
  if (max <= 0 || amount === 0) return 0;
  return Math.min(100, Math.max(2, Math.round((Math.abs(amount) / max) * 100)));
}
