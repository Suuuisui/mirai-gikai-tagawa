export type BillEraYearGroup<T> = {
  /** 例: "令和7年" */
  label: string;
  bills: T[];
};

type EraPeriod = {
  name: string;
  /** この元号が始まる日付（この日を含む、"YYYY-MM-DD"） */
  startDate: string;
  /** 西暦年からこの数を引くと元号年になる */
  offset: number;
};

// 田川市議会の公開データ範囲（本会議録は平成10年第1回定例会以降）をカバーする元号定義。
// 新しい元号が始まったら先頭に追加する
const ERA_PERIODS: readonly EraPeriod[] = [
  { name: "令和", startDate: "2019-05-01", offset: 2018 },
  { name: "平成", startDate: "1989-01-08", offset: 1988 },
];

/** 提出日が不明な議案をまとめるグループのラベル */
export const UNKNOWN_ERA_YEAR_LABEL = "提出日不明";

/**
 * "YYYY-MM-DD" 形式の日付から和暦年ラベル（例: "令和7年"）を求める。
 * 日付がnull、または対応する元号が無い場合はUNKNOWN_ERA_YEAR_LABELを返す
 */
function toEraYearLabel(dateStr: string | null): string {
  if (!dateStr) return UNKNOWN_ERA_YEAR_LABEL;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return UNKNOWN_ERA_YEAR_LABEL;

  const era = ERA_PERIODS.find((period) => date >= new Date(period.startDate));
  if (!era) return UNKNOWN_ERA_YEAR_LABEL;

  const year = date.getFullYear() - era.offset;
  return year === 1 ? `${era.name}元年` : `${era.name}${year}年`;
}

/**
 * 議案一覧を提出日（submitted_date）の和暦年（令和7年など）ごとにグルーピングする。
 * 入力の並び順（議決日降順）はグループ内・グループ間ともに維持される。
 * submitted_dateが無い議案はUNKNOWN_ERA_YEAR_LABELのグループにまとめる
 */
export function groupBillsByEraYear<
  T extends { submitted_date: string | null },
>(bills: T[]): BillEraYearGroup<T>[] {
  const groups: BillEraYearGroup<T>[] = [];
  const groupByLabel = new Map<string, BillEraYearGroup<T>>();

  for (const bill of bills) {
    const label = toEraYearLabel(bill.submitted_date);
    const existing = groupByLabel.get(label);

    if (existing) {
      existing.bills.push(bill);
      continue;
    }

    const group: BillEraYearGroup<T> = { label, bills: [bill] };
    groupByLabel.set(label, group);
    groups.push(group);
  }

  return groups;
}
