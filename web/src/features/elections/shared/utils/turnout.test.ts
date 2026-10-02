import { describe, expect, it } from "vitest";
import {
  ageComposition,
  ageLabel,
  axisMax,
  compareAgeBands,
  countAgesWomenAhead,
  electionDayVotersAfter,
  extremesBy,
  formatClockTime,
  formatCount,
  formatPeople,
  formatPercent,
  formatPointDiff,
  formatTimeRange,
  formatTimes,
  formatVotes,
  pointDiff,
  roundTo,
  sharePercent,
  singleYearAges,
  summarizeAges,
  summarizeElection,
  summarizePrecinct,
  timesOf,
  turnoutByAgeBand,
  turnoutRate,
  votesByAgeBand,
} from "./turnout";

describe("turnoutRate", () => {
  it("投票者数 ÷ 有権者数 × 100 を小数第2位で四捨五入する", () => {
    expect(turnoutRate(20817, 35839)).toBe(58.08);
    expect(turnoutRate(1, 3)).toBe(33.33);
  });

  it("有権者が0なら0を返す", () => {
    expect(turnoutRate(0, 0)).toBe(0);
  });
});

describe("sharePercent", () => {
  it("割合を小数第1位で丸める", () => {
    expect(sharePercent(10176, 20817)).toBe(48.9);
    expect(sharePercent(0, 0)).toBe(0);
  });
});

describe("summarizePrecinct", () => {
  it("当日・期日前・不在者を足して投票者数と棄権者数、投票率を出す", () => {
    const row = summarizePrecinct([1, 100, 120, 20, 30, 15, 25, 1, 2]);
    expect(row.voters).toEqual({ male: 36, female: 57, total: 93 });
    expect(row.abstained).toEqual({ male: 64, female: 63, total: 127 });
    expect(row.rate).toEqual({ male: 36, female: 47.5, total: 42.27 });
    expect(row.earlyShare).toBe(43);
  });
});

describe("summarizeElection", () => {
  it("投票区を合計する", () => {
    const summary = summarizeElection([
      [1, 10, 10, 2, 2, 2, 2, 0, 0],
      [2, 20, 20, 5, 5, 1, 1, 1, 1],
    ]);
    expect(summary.precincts).toHaveLength(2);
    expect(summary.total.electorate.total).toBe(60);
    expect(summary.total.voters.total).toBe(22);
    expect(summary.total.rate.total).toBe(36.67);
  });
});

describe("年代別の集計", () => {
  const ages = summarizeAges([
    [18, 10, 10, 2, 4],
    [19, 10, 10, 3, 5],
    [20, 20, 20, 4, 4],
    [80, 30, 50, 10, 20],
  ]);

  it("帯ごとに有権者と投票者を合計して投票率を出す", () => {
    const [teens, twenties] = turnoutByAgeBand(ages, [
      { label: "18・19歳", from: 18, to: 19 },
      { label: "20〜24歳", from: 20, to: 24 },
    ]);
    expect(teens.electorate.total).toBe(40);
    expect(teens.voters.total).toBe(14);
    expect(teens.rate.total).toBe(35);
    expect(twenties.rate.total).toBe(20);
  });

  it("上限なしの帯は80歳以上を含む", () => {
    const [older] = turnoutByAgeBand(ages, [
      { label: "65歳以上", from: 65, to: null },
    ]);
    expect(older.voters.total).toBe(30);
  });

  it("有権者に占める割合と投票した人に占める割合を出す", () => {
    const [young, older] = ageComposition(ages, [
      { label: "18〜39歳", from: 18, to: 39 },
      { label: "65歳以上", from: 65, to: null },
    ]);
    expect(young.electorateShare).toBe(50);
    expect(young.votersShare).toBe(42.3);
    expect(older.electorateShare).toBe(50);
    expect(older.votersShare).toBe(57.7);
  });

  it("女性の投票率が男性を上回った年齢を数える", () => {
    expect(countAgesWomenAhead(ages)).toBe(3);
  });

  it("帯ごとの票の数・投票しなかった人・投票した人全体に占める割合を出す", () => {
    const rows = votesByAgeBand(ages, [
      { label: "18・19歳", from: 18, to: 19 },
      { label: "20〜24歳", from: 20, to: 24 },
      { label: "80歳以上", from: 80, to: null },
    ]);
    expect(rows.map((row) => row.band.label)).toEqual([
      "18・19歳",
      "20〜24歳",
      "80歳以上",
    ]);
    expect(rows[0]).toMatchObject({
      electorate: 40,
      voters: 14,
      abstained: 26,
      votersShare: 26.9,
    });
    expect(rows[1]).toMatchObject({
      voters: 8,
      abstained: 32,
      votersShare: 15.4,
    });
    expect(rows[2]).toMatchObject({
      voters: 30,
      abstained: 50,
      votersShare: 57.7,
    });
  });

  it("票の数の帯は既定で資料と同じ5歳刻みの14区分になる", () => {
    expect(votesByAgeBand(ages)).toHaveLength(14);
  });

  it("1歳ぶんの行だけを残し、「80歳以上」のまとめた行を除く", () => {
    expect(singleYearAges(ages).map((row) => row.age)).toEqual([18, 19, 20]);
  });
});

describe("ageLabel", () => {
  it("80は「80歳以上」と表示する", () => {
    expect(ageLabel(18)).toBe("18歳");
    expect(ageLabel(80)).toBe("80歳以上");
  });
});

describe("extremesBy", () => {
  it("最小と最大を返す", () => {
    const { min, max } = extremesBy([3, 1, 2], (n) => n);
    expect(min).toBe(1);
    expect(max).toBe(3);
  });

  it("同じ値なら先に出たものを返す", () => {
    const items = [
      { id: "a", v: 1 },
      { id: "b", v: 1 },
    ];
    const { min, max } = extremesBy(items, (item) => item.v);
    expect(min.id).toBe("a");
    expect(max.id).toBe("a");
  });

  it("空の配列はエラーにする", () => {
    expect(() => extremesBy([], (n: number) => n)).toThrow();
  });
});

describe("electionDayVotersAfter", () => {
  const progress = [
    { time: "18:00", voters: 80 },
    { time: "19:30", voters: 95 },
  ];

  it("結了時の当日投票者数との差を返す", () => {
    expect(electionDayVotersAfter(progress, "18:00", 100)).toBe(20);
  });

  it("速報に無い時刻はエラーにする", () => {
    expect(() => electionDayVotersAfter(progress, "17:00", 100)).toThrow();
  });
});

describe("pointDiff", () => {
  it("表示に使う丸めた値どうしの差を返す", () => {
    expect(pointDiff(66.67, 63.52)).toBe(3.2);
    expect(pointDiff(49.11, 49.45)).toBe(-0.4);
    expect(pointDiff(67.33, 78.09)).toBe(-10.8);
  });
});

describe("roundTo", () => {
  it("指定の桁で四捨五入する", () => {
    expect(roundTo(58.08)).toBe(58.1);
    expect(roundTo(58.08, 2)).toBe(58.08);
    expect(roundTo(50.05)).toBe(50.1);
    expect(roundTo(1.005, 2)).toBe(1.01);
  });
});

describe("compareAgeBands", () => {
  it("同じ帯どうしを並べ、表示値どうしの差を付ける", () => {
    const current = summarizeAges([
      [18, 100, 100, 40, 40],
      [80, 100, 100, 50, 50],
    ]);
    const previous = summarizeAges([
      [18, 100, 100, 45, 45],
      [80, 100, 100, 60, 60],
    ]);
    const rows = compareAgeBands(current, previous);
    const teens = rows.find((row) => row.band.label === "18・19歳");
    const older = rows.find((row) => row.band.label === "80歳以上");
    expect(teens?.diff).toBe(-5);
    expect(teens?.current.rate.total).toBe(40);
    expect(teens?.previous.rate.total).toBe(45);
    expect(older?.diff).toBe(-10);
    expect(rows).toHaveLength(14);
  });
});

describe("axisMax", () => {
  it("最大値を10刻みで切り上げる", () => {
    expect(axisMax([44.7, 41.9, 21.9])).toBe(50);
    expect(axisMax([50])).toBe(50);
    expect(axisMax([])).toBe(0);
  });
});

describe("timesOf", () => {
  it("a が b の何倍かを小数第1位で四捨五入する", () => {
    expect(timesOf(603, 97)).toBe(6.2);
    expect(timesOf(855, 329)).toBe(2.6);
    expect(timesOf(70.5, 29.5)).toBe(2.4);
  });

  it("b が0以下なら0を返す", () => {
    expect(timesOf(10, 0)).toBe(0);
  });
});

describe("formatClockTime", () => {
  it("ちょうどの時刻は分を省く", () => {
    expect(formatClockTime("10:00")).toBe("10時");
    expect(formatClockTime("19:30")).toBe("19時30分");
    expect(formatClockTime("07:00")).toBe("7時");
  });
});

describe("formatTimeRange", () => {
  it("「○時から○時まで」の形にする", () => {
    expect(formatTimeRange("07:00", "20:00")).toBe("7時から20時まで");
    expect(formatTimeRange("08:30", "20:00")).toBe("8時30分から20時まで");
  });
});

describe("表示用の整形", () => {
  it("formatPercent は小数の桁数を指定できる", () => {
    expect(formatPercent(58.08)).toBe("58.1%");
    expect(formatPercent(58.08, 2)).toBe("58.08%");
  });

  it("formatPercent は2進数の誤差に左右されず四捨五入する", () => {
    expect(formatPercent(50.05)).toBe("50.1%");
    expect(formatPercent(47.65)).toBe("47.7%");
  });

  it("formatCount は3桁ごとに区切る", () => {
    expect(formatCount(20817)).toBe("20,817");
    expect(formatCount(0)).toBe("0");
  });

  it("formatPeople は人数に「人」を付ける", () => {
    expect(formatPeople(20817)).toBe("20,817人");
  });

  it("formatVotes は票の数に「票」を付ける", () => {
    expect(formatVotes(2588)).toBe("2,588票");
  });

  it("formatTimes は倍率を小数第1位まで表示する", () => {
    expect(formatTimes(6.216)).toBe("6.2倍");
    expect(formatTimes(2)).toBe("2.0倍");
  });

  it("formatPointDiff は符号付きで表示する", () => {
    expect(formatPointDiff(-5.77)).toBe("−5.8ポイント");
    expect(formatPointDiff(1.24)).toBe("+1.2ポイント");
    expect(formatPointDiff(0.01)).toBe("±0.0ポイント");
  });
});
