import { describe, expect, it } from "vitest";
import {
  calculateAge,
  calculateVoteShares,
  compactName,
  createSourceResolver,
  daysSinceInauguration,
  daysUntil,
  filterBillsSince,
  newestFirst,
  sessionTimingLabel,
} from "./mayor-activity";

describe("compactName", () => {
  it("姓名の間の空白を詰める", () => {
    expect(compactName("浦野 仁")).toBe("浦野仁");
  });
});

describe("calculateAge", () => {
  it("誕生日前なら1つ若い", () => {
    expect(calculateAge("1995-06-24", new Date(2026, 5, 23))).toBe(30);
  });

  it("誕生日当日から年齢が上がる", () => {
    expect(calculateAge("1995-06-24", new Date(2026, 5, 24))).toBe(31);
  });
});

describe("daysSinceInauguration", () => {
  it("就任日当日を1日目と数える", () => {
    expect(daysSinceInauguration("2026-07-13", new Date(2026, 6, 13))).toBe(1);
  });

  it("翌日は2日目", () => {
    expect(daysSinceInauguration("2026-07-13", new Date(2026, 6, 14))).toBe(2);
  });

  it("就任前は0", () => {
    expect(daysSinceInauguration("2026-07-13", new Date(2026, 6, 1))).toBe(0);
  });
});

describe("daysUntil", () => {
  it("未来の日付までの日数を返す", () => {
    expect(daysUntil("2026-09-07", new Date(2026, 8, 3))).toBe(4);
  });

  it("当日は0", () => {
    expect(daysUntil("2026-09-07", new Date(2026, 8, 7))).toBe(0);
  });

  it("過ぎた日付は負の数", () => {
    expect(daysUntil("2026-09-07", new Date(2026, 8, 10))).toBe(-3);
  });
});

describe("sessionTimingLabel", () => {
  const session = { startDate: "2026-09-07", endDate: "2026-10-08" };

  it("開会前は残り日数を添える", () => {
    expect(sessionTimingLabel(session, new Date(2026, 8, 3))).toBe(
      "あと4日で開会"
    );
  });

  it("開会当日は「きょう開会」", () => {
    expect(sessionTimingLabel(session, new Date(2026, 8, 7))).toBe(
      "きょう開会"
    );
  });

  it("会期中は閉会日を添える（最終日も会期中）", () => {
    expect(sessionTimingLabel(session, new Date(2026, 9, 8))).toBe(
      "会期中（2026.10.8まで）"
    );
  });

  it("閉会後は null（予告を出さない）", () => {
    expect(sessionTimingLabel(session, new Date(2026, 9, 9))).toBeNull();
  });
});

describe("newestFirst", () => {
  it("日付の新しい順に並べ、同じ日は元の順を保つ", () => {
    const events = [
      { date: "2026-07-13", title: "就任" },
      { date: "2026-08-04", title: "あいさつ" },
      { date: "2026-08-04", title: "条例の方針" },
      { date: "2026-08-19", title: "定例会の説明" },
    ];

    expect(newestFirst(events).map((e) => e.title)).toEqual([
      "定例会の説明",
      "あいさつ",
      "条例の方針",
      "就任",
    ]);
    expect(events[0].title).toBe("就任");
  });
});

describe("filterBillsSince", () => {
  it("提出日がタイムスタンプ形式でも日付で比較する", () => {
    const bills = [
      { submitted_date: "2026-07-01T00:00:00+00:00" },
      { submitted_date: "2026-08-10T00:00:00+00:00" },
    ];

    expect(filterBillsSince(bills, "2026-07-13")).toHaveLength(1);
  });

  it("提出日が無い議案は含めない", () => {
    expect(filterBillsSince([{ submitted_date: null }], "2026-07-13")).toEqual(
      []
    );
  });
});

describe("calculateVoteShares", () => {
  it("各候補者に得票率と最多得票を100とした長さを添えて入力の順で返す", () => {
    expect(
      calculateVoteShares([
        { name: "a", votes: 6000 },
        { name: "b", votes: 3000 },
        { name: "c", votes: 1000 },
      ])
    ).toEqual([
      { name: "a", votes: 6000, percent: 60, relative: 100 },
      { name: "b", votes: 3000, percent: 30, relative: 50 },
      { name: "c", votes: 1000, percent: 10, relative: 17 },
    ]);
  });

  it("得票率は小数1桁に丸める", () => {
    expect(
      calculateVoteShares([{ votes: 8345 }, { votes: 4637 }])[0].percent
    ).toBe(64.3);
  });

  it("候補者がいなければ空、得票0でも割り算で壊れない", () => {
    expect(calculateVoteShares([])).toEqual([]);
    expect(calculateVoteShares([{ votes: 0 }])).toEqual([
      { votes: 0, percent: 0, relative: 0 },
    ]);
  });
});

describe("createSourceResolver", () => {
  const resolve = createSourceResolver({
    meetings: [
      {
        id: "m1",
        committee_name: "総務文教委員会",
        meeting_date: "2026-08-04",
      },
      {
        id: "m2",
        committee_name: "議会運営委員会",
        meeting_date: "2026-08-04",
      },
    ],
    bills: [{ id: "b1", name: "市長の退職の期日に関する同意について" }],
  });

  it("会議は委員会名と開催日で引き、短縮名付きのラベルにする", () => {
    expect(
      resolve({
        kind: "meeting",
        committeeName: "議会運営委員会",
        meetingDate: "2026-08-04",
      })
    ).toEqual({
      href: "/committees/m2",
      label: "議会運営委員会の記録",
      external: false,
    });
  });

  it("議案は名前で引く", () => {
    expect(
      resolve({
        kind: "bill",
        billName: "市長の退職の期日に関する同意について",
      })
    ).toEqual({ href: "/bills/b1", label: "議案を見る", external: false });
  });

  it("公式ページはそのまま外部リンクにする", () => {
    expect(
      resolve({ kind: "official", url: "https://example.com", label: "公式" })
    ).toEqual({ href: "https://example.com", label: "公式", external: true });
  });

  it("一覧に無い会議・議案は null（リンクを出さない）", () => {
    expect(
      resolve({
        kind: "meeting",
        committeeName: "厚生委員会",
        meetingDate: "2026-08-04",
      })
    ).toBeNull();
    expect(resolve({ kind: "bill", billName: "存在しない議案" })).toBeNull();
  });
});
