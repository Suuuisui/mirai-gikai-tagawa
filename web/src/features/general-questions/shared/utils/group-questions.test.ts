import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";
import { describe, expect, it } from "vitest";
import {
  compareSessionKeysDesc,
  countQuestionItems,
  formatQuestionDayLabel,
  formatQuestionPeriod,
  groupQuestionsBySession,
  questionAnchorId,
  selectQuestionsByMember,
  selectQuestionsForSession,
} from "./group-questions";

function record(
  overrides: Partial<GeneralQuestionRecord> & {
    id: string;
    sessionKey: string;
    order: number;
  }
): GeneralQuestionRecord {
  return {
    sessionName: overrides.sessionKey,
    questionDate: null,
    dayIndex: null,
    memberName: "山野 義人",
    familyName: "山野",
    faction: null,
    isRepresentative: false,
    format: null,
    items: ["Aについて"],
    outline: null,
    videoUrl: null,
    sourceUrl: "https://example.com",
    pdfUrl: null,
    ...overrides,
  };
}

const sep1 = record({
  id: "r8-6-teirei-1",
  sessionKey: "r8-6-teirei",
  order: 1,
  questionDate: "2026-09-09",
  dayIndex: 1,
});
const sep2 = record({
  id: "r8-6-teirei-2",
  sessionKey: "r8-6-teirei",
  order: 2,
  questionDate: "2026-09-09",
  dayIndex: 1,
  familyName: "榊原",
  memberName: "榊原 大祐",
  items: ["B", "C"],
});
const sep6 = record({
  id: "r8-6-teirei-6",
  sessionKey: "r8-6-teirei",
  order: 6,
  questionDate: "2026-09-10",
  dayIndex: 2,
});
const jun1 = record({
  id: "r8-4-teirei-1",
  sessionKey: "r8-4-teirei",
  order: 1,
  questionDate: "2026-06-17",
  dayIndex: 1,
});
const jun3 = record({
  id: "r8-4-teirei-3",
  sessionKey: "r8-4-teirei",
  order: 3,
  questionDate: "2026-06-18",
  dayIndex: 2,
});
const undated = record({
  id: "h29-1-teirei-1",
  sessionKey: "h29-1-teirei",
  order: 1,
});
const takaseFujio = record({
  id: "r7-7-teirei-2",
  sessionKey: "r7-7-teirei",
  order: 2,
  questionDate: "2025-12-03",
  familyName: "髙瀬",
  memberName: "髙瀬 冨士夫",
});
const takaseHarumi = record({
  id: "h29-4-teirei-4",
  sessionKey: "h29-4-teirei",
  order: 4,
  questionDate: "2017-09-07",
  familyName: "髙瀬",
  memberName: "髙瀬 春美",
});

describe("groupQuestionsBySession", () => {
  it("会期ごとにまとめ、新しい会期→順番の順に並べる", () => {
    const groups = groupQuestionsBySession([
      jun3,
      sep6,
      undated,
      sep1,
      jun1,
      sep2,
    ]);
    expect(groups.map((g) => g.sessionKey)).toEqual([
      "r8-6-teirei",
      "r8-4-teirei",
      "h29-1-teirei",
    ]);
    expect(groups[0].records.map((r) => r.order)).toEqual([1, 2, 6]);
    expect(groups[0].firstDate).toBe("2026-09-09");
    expect(groups[0].lastDate).toBe("2026-09-10");
  });

  it("会期内は質問日ごとに分ける", () => {
    const [sep] = groupQuestionsBySession([sep6, sep1, sep2]);
    expect(sep.days.map((d) => [d.date, d.dayIndex, d.records.length])).toEqual(
      [
        ["2026-09-09", 1, 2],
        ["2026-09-10", 2, 1],
      ]
    );
  });

  it("同じ日付の記録は離れて並んでいても1つの日にまとめる", () => {
    const [sep] = groupQuestionsBySession([sep1, sep6, sep2]);
    expect(sep.days.map((d) => d.records.map((r) => r.order))).toEqual([
      [1, 2],
      [6],
    ]);
  });

  it("日付の無い会期は末尾に回る", () => {
    const groups = groupQuestionsBySession([undated, sep1]);
    expect(groups[1].firstDate).toBeNull();
    expect(groups[1].days[0].date).toBeNull();
  });

  it("記録が無ければ空配列", () => {
    expect(groupQuestionsBySession([])).toEqual([]);
  });
});

describe("compareSessionKeysDesc", () => {
  it("元号・年・回を数値で比べ、令和10年が令和9年より新しい", () => {
    expect(
      ["r9-1-teirei", "r10-1-teirei", "h31-1-teirei"].sort(
        compareSessionKeysDesc
      )
    ).toEqual(["r10-1-teirei", "r9-1-teirei", "h31-1-teirei"]);
  });
});

describe("selectQuestionsForSession / selectQuestionsByMember", () => {
  it("会期キーで絞り込み、順番で並べる", () => {
    expect(
      selectQuestionsForSession([sep6, sep1], "r8-6-teirei").map((r) => r.order)
    ).toEqual([1, 6]);
    expect(selectQuestionsForSession([sep1], null)).toEqual([]);
    expect(selectQuestionsForSession([sep1], "r99-1-teirei")).toEqual([]);
  });

  it("議員の姓で絞り込み、新しい順に並べる", () => {
    expect(
      selectQuestionsByMember([jun1, sep1, sep2, undated], {
        familyName: "山野",
        fullName: null,
      }).map((r) => r.id)
    ).toEqual(["r8-6-teirei-1", "r8-4-teirei-1", "h29-1-teirei-1"]);
  });

  it("フルネームが分かっていれば同じ姓の別人は除く", () => {
    expect(
      selectQuestionsByMember([takaseFujio, takaseHarumi], {
        familyName: "髙瀬",
        fullName: "髙瀬 冨士夫",
      }).map((r) => r.id)
    ).toEqual(["r7-7-teirei-2"]);
    expect(
      selectQuestionsByMember([takaseFujio, takaseHarumi], {
        familyName: "髙瀬",
        fullName: null,
      })
    ).toHaveLength(2);
  });
});

describe("表示用の文字列", () => {
  it("日付見出しは「N日目（M月D日）」、不明なら「日程未確認」", () => {
    expect(formatQuestionDayLabel({ date: "2026-09-09", dayIndex: 1 })).toBe(
      "1日目（9月9日）"
    );
    expect(formatQuestionDayLabel({ date: "2026-09-09", dayIndex: null })).toBe(
      "9月9日"
    );
    expect(formatQuestionDayLabel({ date: null, dayIndex: null })).toBe(
      "日程未確認"
    );
  });

  it("質問期間は同じ月なら日だけを繋ぎ、1日だけならその日", () => {
    expect(
      formatQuestionPeriod({ firstDate: "2026-09-09", lastDate: "2026-09-11" })
    ).toBe("9月9日〜11日");
    expect(
      formatQuestionPeriod({ firstDate: "2026-02-27", lastDate: "2026-03-09" })
    ).toBe("2月27日〜3月9日");
    expect(
      formatQuestionPeriod({ firstDate: "2026-09-09", lastDate: "2026-09-09" })
    ).toBe("9月9日");
    expect(formatQuestionPeriod({ firstDate: null, lastDate: null })).toBe(
      "日程未確認"
    );
  });

  it("質問事項の総数とアンカーid", () => {
    expect(countQuestionItems([sep1, sep2])).toBe(3);
    expect(questionAnchorId(sep6)).toBe("q-6");
  });
});
