import { describe, expect, it } from "vitest";
import {
  COUNCIL_BY_ELECTION,
  FORMER_MAYOR_NAME,
  MAYOR_ACTIONS,
  MAYOR_PROFILE,
  MAYORAL_ELECTION,
  ROAD_TO_INAUGURATION,
  ROAD_TO_INAUGURATION_SUMMARY,
  UPCOMING_SESSION,
} from "./mayor-profile";

/** 手で書き足すデータなので、並び順や日付の整合を機械的に守る */
function isSortedAscending(dates: readonly string[]): boolean {
  return dates.every((date, i) => i === 0 || dates[i - 1] <= date);
}

describe("MAYOR_ACTIONS", () => {
  it("就任日以降の出来事だけを古い順に持つ", () => {
    const dates = MAYOR_ACTIONS.map((event) => event.date);
    expect(dates[0]).toBe(MAYOR_PROFILE.inaugurationDate);
    expect(isSortedAscending(dates)).toBe(true);
  });

  it("見出しは一覧で折り返しすぎない長さに収める", () => {
    for (const event of MAYOR_ACTIONS) {
      expect(event.title.length).toBeLessThanOrEqual(30);
    }
  });
});

describe("ROAD_TO_INAUGURATION", () => {
  it("古い順に並び、就任日で終わる", () => {
    const dates = ROAD_TO_INAUGURATION.map((event) => event.date);
    expect(isSortedAscending(dates)).toBe(true);
    expect(dates.at(-1)).toBe(MAYOR_PROFILE.inaugurationDate);
  });

  it("見出しは一覧で折り返しすぎない長さに収める", () => {
    for (const event of ROAD_TO_INAUGURATION) {
      expect(event.title.length).toBeLessThanOrEqual(30);
    }
  });

  // 浦野市長のページに載るため、「市長」とだけ書くと本人の話に読めてしまう
  it("市長選より前の出来事は前市長の氏名を明記する", () => {
    const beforeElection = ROAD_TO_INAUGURATION.filter(
      (event) => event.date < MAYORAL_ELECTION.date
    );
    expect(beforeElection.length).toBeGreaterThan(0);
    for (const event of beforeElection) {
      expect(`${event.title}${event.description}`).toContain(FORMER_MAYOR_NAME);
    }
    expect(ROAD_TO_INAUGURATION_SUMMARY).toContain(FORMER_MAYOR_NAME);
  });
});

describe("UPCOMING_SESSION", () => {
  it("会期の開始が終了より前で、見どころは3つまで", () => {
    expect(UPCOMING_SESSION.startDate <= UPCOMING_SESSION.endDate).toBe(true);
    expect(UPCOMING_SESSION.highlights.length).toBeLessThanOrEqual(3);
  });
});

describe("選挙結果", () => {
  it("市長選の当選者は1人", () => {
    expect(MAYORAL_ELECTION.candidates.filter((c) => c.elected)).toHaveLength(
      1
    );
  });

  it("補欠選挙の当選者数は欠員数と一致する", () => {
    expect(
      COUNCIL_BY_ELECTION.candidates.filter((c) => c.elected)
    ).toHaveLength(COUNCIL_BY_ELECTION.seats);
  });
});
