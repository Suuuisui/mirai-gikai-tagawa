import { describe, expect, it } from "vitest";
import {
  ageComposition,
  formatPercent,
  pointDiff,
  roundTo,
  summarizeAges,
  summarizeElection,
  turnoutByAgeBand,
} from "../utils/turnout";
import {
  COUNCIL_BY_ELECTION_2026,
  COUNCIL_ELECTION_2023,
  COUNCIL_ELECTION_HISTORY,
  type ElectionTurnoutSource,
  MAYOR_ELECTION_2026,
  MAYOR_ELECTION_2026_DAY_PROGRESS,
  POLLING_PLACES_2026,
} from "./turnout-data";

/**
 * 開示文書（投票結果速報集計用紙・年代別 投票者数・投票率）に印刷されている
 * 小計・合計・投票率。転記した男女別の人数から計算した値がこれと一致することを確かめる
 */
const PRINTED_TOTALS: Record<
  ElectionTurnoutSource["id"],
  {
    precinctCount: number;
    electorate: number;
    electionDay: number;
    early: number;
    absentee: number;
    voters: number;
    abstained: number;
    rate: { male: number; female: number; total: number };
  }
> = {
  "mayor-2026": {
    precinctCount: 15,
    electorate: 35839,
    electionDay: 10364,
    early: 10176,
    absentee: 277,
    voters: 20817,
    abstained: 15022,
    rate: { male: 56.46, female: 59.45, total: 58.08 },
  },
  "council-by-2026": {
    precinctCount: 15,
    electorate: 35839,
    electionDay: 10362,
    early: 10169,
    absentee: 276,
    voters: 20807,
    abstained: 15032,
    rate: { male: 56.43, female: 59.43, total: 58.06 },
  },
  "council-2023": {
    precinctCount: 20,
    electorate: 37341,
    electionDay: 13569,
    early: 9887,
    absentee: 387,
    voters: 23843,
    abstained: 13498,
    rate: { male: 62.19, female: 65.26, total: 63.85 },
  },
};

/** 年代別の表に印刷されている5歳刻みの小計（有権者数, 投票者数, 投票率） */
const PRINTED_BAND_SUBTOTALS: Record<
  ElectionTurnoutSource["id"],
  readonly (readonly [number, number, number])[]
> = {
  "mayor-2026": [
    [871, 374, 42.94],
    [1876, 625, 33.32],
    [1592, 661, 41.52],
    [1635, 803, 49.11],
    [1892, 989, 52.27],
    [2345, 1278, 54.5],
    [2636, 1567, 59.45],
    [2977, 1926, 64.7],
    [2647, 1711, 64.64],
    [2352, 1569, 66.71],
    [2781, 1907, 68.57],
    [3270, 2256, 68.99],
    [3844, 2588, 67.33],
    [5121, 2563, 50.05],
  ],
  "council-by-2026": [
    [871, 374, 42.94],
    [1876, 625, 33.32],
    [1592, 661, 41.52],
    [1635, 803, 49.11],
    [1892, 989, 52.27],
    [2345, 1277, 54.46],
    [2636, 1567, 59.45],
    [2977, 1925, 64.66],
    [2647, 1711, 64.64],
    [2352, 1569, 66.71],
    [2781, 1906, 68.54],
    [3270, 2256, 68.99],
    [3844, 2587, 67.3],
    [5121, 2557, 49.93],
  ],
  "council-2023": [
    [856, 388, 45.33],
    [1857, 758, 40.82],
    [1711, 754, 44.07],
    [1830, 905, 49.45],
    [2232, 1238, 55.47],
    [2478, 1512, 61.02],
    [2910, 1821, 62.58],
    [2788, 1896, 68.01],
    [2438, 1619, 66.41],
    [2692, 1960, 72.81],
    [3094, 2356, 76.15],
    [4144, 3202, 77.27],
    [2953, 2306, 78.09],
    [5358, 3128, 58.38],
  ],
};

const ELECTIONS = [
  MAYOR_ELECTION_2026,
  COUNCIL_BY_ELECTION_2026,
  COUNCIL_ELECTION_2023,
];

describe.each(ELECTIONS)("$name（$date）", (source) => {
  const printed = PRINTED_TOTALS[source.id];
  const summary = summarizeElection(source.precincts);
  const ages = summarizeAges(source.ages);

  it("投票区の数と合計が資料の小計と一致する", () => {
    expect(summary.precincts).toHaveLength(printed.precinctCount);
    expect(summary.total.electorate.total).toBe(printed.electorate);
    expect(summary.total.electionDay.total).toBe(printed.electionDay);
    expect(summary.total.early.total).toBe(printed.early);
    expect(summary.total.absentee.total).toBe(printed.absentee);
    expect(summary.total.voters.total).toBe(printed.voters);
    expect(summary.total.abstained.total).toBe(printed.abstained);
    expect(summary.total.rate).toEqual(printed.rate);
  });

  it("投票区は1から順に欠けなく並ぶ", () => {
    expect(summary.precincts.map((p) => p.precinct)).toEqual(
      Array.from({ length: printed.precinctCount }, (_, i) => i + 1)
    );
  });

  it("年代別の表は18歳から80歳以上まで1歳刻みで、合計が投票区の表と一致する", () => {
    expect(ages.map((row) => row.age)).toEqual(
      Array.from({ length: 63 }, (_, i) => i + 18)
    );
    const electorate = ages.reduce((n, row) => n + row.electorate.total, 0);
    const voters = ages.reduce((n, row) => n + row.voters.total, 0);
    expect(electorate).toBe(printed.electorate);
    expect(voters).toBe(printed.voters);
  });

  it("5歳刻みの集計が資料の小計と一致する", () => {
    const bands = turnoutByAgeBand(ages).map(
      (row) => [row.electorate.total, row.voters.total, row.rate.total] as const
    );
    expect(bands).toEqual(PRINTED_BAND_SUBTOTALS[source.id]);
  });

  it("年代別の表の男女別の合計も投票区の表と一致する（男女の取り違えを防ぐ）", () => {
    for (const sex of ["male", "female"] as const) {
      expect(ages.reduce((n, row) => n + row.electorate[sex], 0)).toBe(
        summary.total.electorate[sex]
      );
      expect(ages.reduce((n, row) => n + row.voters[sex], 0)).toBe(
        summary.total.voters[sex]
      );
    }
  });

  it("投票区の行で投票した人が有権者を超えず、棄権者が負にならない", () => {
    for (const row of summary.precincts) {
      expect(row.voters.total).toBeLessThanOrEqual(row.electorate.total);
      expect(row.abstained.male).toBeGreaterThanOrEqual(0);
      expect(row.abstained.female).toBeGreaterThanOrEqual(0);
    }
  });

  it("投票した人が有権者を超える行は無い", () => {
    for (const row of ages) {
      expect(row.voters.male).toBeLessThanOrEqual(row.electorate.male);
      expect(row.voters.female).toBeLessThanOrEqual(row.electorate.female);
    }
  });

  it("構成比は 18〜39歳・40〜64歳・65歳以上 の順に並ぶ", () => {
    expect(ageComposition(ages).map((row) => row.band.label)).toEqual([
      "18〜39歳",
      "40〜64歳",
      "65歳以上",
    ]);
  });

  it("有権者の構成比と投票した人の構成比はそれぞれ合計がほぼ100%になる", () => {
    const composition = ageComposition(ages);
    const sum = (key: "electorateShare" | "votersShare") =>
      composition.reduce((n, row) => n + row[key], 0);
    expect(sum("electorateShare")).toBeCloseTo(100, 0);
    expect(sum("votersShare")).toBeCloseTo(100, 0);
  });
});

describe("年齢を選ぶ部品の比較表示", () => {
  it("令和8年と令和5年のどの年齢・性別でも、差は画面に出る2つの値の差と一致する", () => {
    const current = summarizeAges(MAYOR_ELECTION_2026.ages);
    const previous = summarizeAges(COUNCIL_ELECTION_2023.ages);
    current.forEach((now, i) => {
      for (const sex of ["total", "male", "female"] as const) {
        const a = now.rate[sex];
        const b = previous[i].rate[sex];
        const shown =
          Number.parseFloat(formatPercent(a)) -
          Number.parseFloat(formatPercent(b));
        expect(pointDiff(a, b)).toBe(roundTo(shown));
      }
    });
  });
});

describe("COUNCIL_ELECTION_HISTORY", () => {
  it("全体の投票率は男女の投票率の間にある", () => {
    for (const row of COUNCIL_ELECTION_HISTORY) {
      const low = Math.min(row.rate.male, row.rate.female);
      const high = Math.max(row.rate.male, row.rate.female);
      expect(row.rate.total).toBeGreaterThanOrEqual(low);
      expect(row.rate.total).toBeLessThanOrEqual(high);
    }
  });

  it("古い順に並ぶ", () => {
    const dates = COUNCIL_ELECTION_HISTORY.map((row) => row.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("令和5年と令和8年の値は詳しい資料の集計と一致する", () => {
    for (const source of [COUNCIL_ELECTION_2023, COUNCIL_BY_ELECTION_2026]) {
      const entry = COUNCIL_ELECTION_HISTORY.find(
        (row) => row.date === source.date
      );
      const { total } = summarizeElection(source.precincts);
      expect(entry?.rate).toEqual(total.rate);
      expect(entry?.earlyVoters).toBe(total.early.total);
      expect(entry?.absenteeVoters).toBe(total.absentee.total);
    }
  });
});

describe("MAYOR_ELECTION_2026_DAY_PROGRESS", () => {
  it("時刻は古い順で、18時の値がある（18時以降の人数の計算に使う）", () => {
    const times = MAYOR_ELECTION_2026_DAY_PROGRESS.map((p) => p.time);
    expect([...times].sort()).toEqual(times);
    expect(times).toContain("18:00");
  });

  it("累計なので時刻とともに増え、結了時の当日投票者数を超えない", () => {
    const voters = MAYOR_ELECTION_2026_DAY_PROGRESS.map((p) => p.voters);
    expect([...voters].sort((a, b) => a - b)).toEqual(voters);
    const { total } = summarizeElection(MAYOR_ELECTION_2026.precincts);
    expect(voters.at(-1)).toBeLessThanOrEqual(total.electionDay.total);
  });
});

describe("POLLING_PLACES_2026", () => {
  it("令和8年の15投票区すべてに投票所がある", () => {
    for (const precinct of MAYOR_ELECTION_2026.precincts) {
      expect(POLLING_PLACES_2026[precinct[0]]).toBeTruthy();
    }
  });
});
