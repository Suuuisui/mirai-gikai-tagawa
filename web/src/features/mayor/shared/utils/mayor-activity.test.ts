import { describe, expect, it } from "vitest";
import {
  calculateAge,
  compactName,
  createSourceResolver,
  daysSinceInauguration,
  filterBillsSince,
  filterMeetingsSince,
  pickPointsMatching,
  shouldShowUpcomingSession,
} from "./mayor-activity";

describe("compactName", () => {
  it("姓名の間の空白を詰める", () => {
    expect(compactName("浦野 仁")).toBe("浦野仁");
  });
});

describe("shouldShowUpcomingSession", () => {
  it("就任後の議案が無く閉会中なら予告を出す", () => {
    expect(shouldShowUpcomingSession(0, false)).toBe(true);
  });

  it("就任後の議案が公開済みなら出さない", () => {
    expect(shouldShowUpcomingSession(1, false)).toBe(false);
  });

  it("会期中なら出さない（会期の情報源を二重にしない）", () => {
    expect(shouldShowUpcomingSession(0, true)).toBe(false);
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

describe("filterMeetingsSince", () => {
  it("基準日以降だけを入力の順のまま返す", () => {
    const meetings = [
      { meeting_date: "2026-08-19" },
      { meeting_date: "2026-07-13" },
      { meeting_date: "2026-07-01" },
    ];

    expect(
      filterMeetingsSince(meetings, "2026-07-13").map((m) => m.meeting_date)
    ).toEqual(["2026-08-19", "2026-07-13"]);
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

describe("pickPointsMatching", () => {
  const patterns = { include: /市長/, exclude: /前市長/ };

  it("includeに当たる要点だけを拾う", () => {
    const points = [
      "市長が就任の挨拶を行いました。",
      "会期は9月7日から10月8日までです。",
      "副市長の選任に同意を求める議案です。",
    ];

    expect(pickPointsMatching(points, patterns)).toEqual([
      "市長が就任の挨拶を行いました。",
      "副市長の選任に同意を求める議案です。",
    ]);
  });

  it("excludeに当たる要点は除く", () => {
    expect(
      pickPointsMatching(["前市長の給料減額条例は廃止する方針です。"], patterns)
    ).toEqual([]);
  });

  it("最大件数で打ち切る", () => {
    expect(
      pickPointsMatching(["市長A", "市長B", "市長C"], patterns, 2)
    ).toEqual(["市長A", "市長B"]);
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
