import { describe, expect, it } from "vitest";
import {
  applyBillLabelAliases,
  billNumberCore,
  buildBillName,
  buildDefaultSummary,
  buildStatusNote,
  carryOverMissingSessions,
  findBillLabelAliases,
  mergeSessions,
  NO_RESULT_NOTE,
  pickActiveSessionKey,
  pruneOngoingSessions,
} from "./session-data-utils";
import type { BillSource, SessionSource } from "./source-data";

function session(key: string, startDate: string): SessionSource {
  return {
    key,
    name: key,
    startDate,
    endDate: startDate,
    sourceUrl: `https://example.com/${key}`,
    bills: [],
  };
}

function bill(
  label: string | null,
  title: string,
  proposer: BillSource["proposer"] = "mayor",
  resultLabel: string | null = "原案可決"
): BillSource {
  return {
    billNumberLabel: label,
    title,
    proposer,
    resultLabel,
    resolvedDate: "2026-09-29",
  };
}

/** 公式ページが会期の途中（9月29日の議決分まで）で公開された9月定例会 */
const officialR86: SessionSource = {
  ...session("r8-6-teirei", "2026-09-07"),
  sourceUrl: "https://example.com/results",
  bills: [
    bill("議案第50号", "一般会計補正予算"),
    bill("議案第61号", "教育委員会委員の任命について（小森田 加恵 氏）", "mayor", "同意"),
    // 公式ページは「議員提出 議案第62号」と2行で書くので、読み取りは「議案第62号」になる
    bill("議案第62号", "政治倫理条例検討特別委員会の設置について", "member"),
    bill(null, "市長の退職の期日に関する同意について", "mayor", "同意"),
  ],
};

/** 会期中に手で置いていた同じ会期（最終日に議決される決算と追加議案を含む） */
const ongoingR86: SessionSource = {
  ...session("r8-6-teirei", "2026-09-07"),
  sourceUrl: "https://example.com/submitted",
  bills: [
    bill("議案第50号", "一般会計補正予算"),
    bill("議案第61号", "教育委員会委員の任命について（小森田加恵氏）", "mayor", "同意"),
    bill("議員提出議案第62号", "政治倫理条例検討特別委員会の設置について", "member"),
    bill(null, "市長の退職の期日に関する同意について", "mayor", "同意"),
    bill("認定第1号", "一般会計決算", "mayor", null),
    // 市長提出の追加議案。議員提出議案第62号と番号は同じだが提出者が違う別の議案
    bill("議案第62号", "一般会計補正予算（追加）", "mayor", null),
  ],
};

describe("billNumberCore", () => {
  it("提出者の語を除いた番号にする", () => {
    expect(billNumberCore("議員提出議案第62号")).toBe("議案第62号");
    expect(billNumberCore("委員会提出議案第3号")).toBe("議案第3号");
  });

  it("提出者の語が無い番号はそのまま", () => {
    expect(billNumberCore("議案第50号")).toBe("議案第50号");
    expect(billNumberCore("認定第1号")).toBe("認定第1号");
  });
});

describe("findBillLabelAliases / applyBillLabelAliases", () => {
  it("提出者と番号が同じで表記だけ違う議案の読み替えを見つける", () => {
    expect(findBillLabelAliases([ongoingR86], [officialR86])).toEqual([
      {
        sessionKey: "r8-6-teirei",
        proposer: "member",
        officialLabel: "議案第62号",
        label: "議員提出議案第62号",
      },
    ]);
  });

  it("公式ページにまだ無い会期や、表記が同じ議案からは何も見つけない", () => {
    expect(findBillLabelAliases([ongoingR86], [])).toEqual([]);
    expect(findBillLabelAliases([officialR86], [officialR86])).toEqual([]);
  });

  it("読み替えは同じ会期・同じ提出者の議案だけに当てる", () => {
    const aliases = findBillLabelAliases([ongoingR86], [officialR86]);
    const other = {
      ...session("r8-4-teirei", "2026-06-12"),
      bills: [bill("議案第62号", "別の会期の議員提出議案", "member")],
    };
    const withMayorBill = {
      ...officialR86,
      bills: [
        ...officialR86.bills,
        bill("議案第62号", "一般会計補正予算（追加）", "mayor"),
      ],
    };

    const [applied, untouched] = applyBillLabelAliases(
      [withMayorBill, other],
      aliases
    );

    expect(applied.bills.map((b) => `${b.proposer}:${b.billNumberLabel}`)).toEqual([
      "mayor:議案第50号",
      "mayor:議案第61号",
      "member:議員提出議案第62号",
      "mayor:null",
      "mayor:議案第62号",
    ]);
    expect(untouched).toBe(other);
  });

  it("読み替えが無ければ会期をそのまま返し、当て直しても変わらない", () => {
    expect(applyBillLabelAliases([officialR86], [])).toEqual([officialR86]);
    const aliases = findBillLabelAliases([ongoingR86], [officialR86]);
    const once = applyBillLabelAliases([officialR86], aliases);
    expect(applyBillLabelAliases(once, aliases)).toEqual(once);
  });
});

describe("pruneOngoingSessions", () => {
  it("公式ページに載った議案だけを外し、まだ載っていない議案は残す", () => {
    const { kept, pruned, partial } = pruneOngoingSessions(
      [ongoingR86],
      [officialR86]
    );

    expect(pruned).toEqual([]);
    expect(kept).toHaveLength(1);
    expect(kept[0].bills.map((b) => `${b.proposer}:${b.billNumberLabel}`)).toEqual([
      "mayor:認定第1号",
      "mayor:議案第62号",
    ]);
    // 残した会期は、会期中の出典ページ（提出議案ページ）を保つ
    expect(kept[0].sourceUrl).toBe("https://example.com/submitted");
    expect(partial).toEqual(kept);
  });

  it("件名の空白や括弧書きの有無が違っても、番号が無い議案を同じ議案として外す", () => {
    const ongoing = {
      ...ongoingR86,
      bills: [bill(null, "市長の退職の期日に関する同意について（案）", "mayor", null)],
    };

    expect(pruneOngoingSessions([ongoing], [officialR86]).pruned).toEqual([ongoing]);
  });

  it("番号が無く括弧書きの中身だけが違う議案は、別の議案として残す", () => {
    const official = {
      ...officialR86,
      bills: [bill(null, "監査委員の選任について（甲 氏）", "mayor", "同意")],
    };
    const ongoing = {
      ...ongoingR86,
      bills: [
        bill(null, "監査委員の選任について（甲氏）", "mayor", null),
        bill(null, "監査委員の選任について（乙氏）", "mayor", null),
      ],
    };

    const { kept } = pruneOngoingSessions([ongoing], [official]);

    expect(kept[0].bills.map((b) => b.title)).toEqual([
      "監査委員の選任について（乙氏）",
    ]);
  });

  it("すべての議案が載った会期は会期ごと外す", () => {
    const allListed = { ...ongoingR86, bills: ongoingR86.bills.slice(0, 4) };
    const { kept, pruned, partial } = pruneOngoingSessions(
      [allListed, session("r8-7-teirei", "2026-12-01")],
      [officialR86]
    );

    expect(pruned).toEqual([allListed]);
    expect(kept.map((s) => s.key)).toEqual(["r8-7-teirei"]);
    expect(partial).toEqual([]);
  });

  it("公式ページがまだ無い会期はそのまま残す", () => {
    expect(pruneOngoingSessions([ongoingR86], [])).toEqual({
      kept: [ongoingR86],
      pruned: [],
      partial: [],
    });
  });
});

describe("buildBillName", () => {
  it("議案番号と件名を全角空白でつなぎ、番号が無ければ件名だけにする", () => {
    expect(buildBillName("議案第50号", "補正予算")).toBe("議案第50号　補正予算");
    expect(buildBillName(null, "番号のない案件")).toBe("番号のない案件");
  });
});

describe("mergeSessions", () => {
  it("取り込み済みの会期の後ろに会期中の会期を並べる", () => {
    const merged = mergeSessions(
      [session("r8-4-teirei", "2026-06-12"), session("r8-5-rinji", "2026-08-10")],
      [session("r8-6-teirei", "2026-09-07")]
    );

    expect(merged.map((s) => s.key)).toEqual([
      "r8-4-teirei",
      "r8-5-rinji",
      "r8-6-teirei",
    ]);
  });

  it("会期中だけの会期の議案には、会期中の出典ページを持たせる", () => {
    const [merged] = mergeSessions([], [ongoingR86]);

    expect(merged.bills.every((b) => b.ongoingSourceUrl === "https://example.com/submitted")).toBe(true);
  });

  it("同じ会期が両方にあれば、公式ページの議案の後ろにまだ載っていない議案を足す", () => {
    const leftover = pruneOngoingSessions([ongoingR86], [officialR86]).kept;

    const [merged] = mergeSessions([officialR86], leftover);

    expect(merged.sourceUrl).toBe("https://example.com/results");
    expect(merged.bills.map((b) => [b.billNumberLabel, b.ongoingSourceUrl])).toEqual([
      ["議案第50号", undefined],
      ["議案第61号", undefined],
      ["議案第62号", undefined],
      [null, undefined],
      ["認定第1号", "https://example.com/submitted"],
      ["議案第62号", "https://example.com/submitted"],
    ]);
  });

  it("同じ議案が両方にあれば、消す先を示して止める", () => {
    expect(() => mergeSessions([officialR86], [ongoingR86])).toThrow(
      /議案第50号 は sessions\.json に取り込み済みです。data\/ongoing-sessions\.json から削除/
    );
  });
});

describe("pickActiveSessionKey", () => {
  it("開会日が最新の会期を入力順に関係なく選ぶ", () => {
    const sessions = [
      session("r8-6-teirei", "2026-09-07"),
      session("r8-4-teirei", "2026-06-12"),
      session("r8-5-rinji", "2026-08-10"),
    ];

    expect(pickActiveSessionKey(sessions)).toBe("r8-6-teirei");
    expect(pickActiveSessionKey([...sessions].reverse())).toBe("r8-6-teirei");
  });

  it("会期が無ければ undefined", () => {
    expect(pickActiveSessionKey([])).toBeUndefined();
  });
});

describe("carryOverMissingSessions", () => {
  it("今回の一覧に無い前回の会期だけを引き継ぐ", () => {
    const { sessions, carried } = carryOverMissingSessions(
      [session("r8-5-rinji", "2026-08-10")],
      [session("r1-5-teirei", "2019-12-02"), session("r8-5-rinji", "2026-08-10")]
    );

    expect(sessions.map((s) => s.key)).toEqual(["r8-5-rinji", "r1-5-teirei"]);
    expect(carried.map((s) => s.key)).toEqual(["r1-5-teirei"]);
  });
});

describe("buildStatusNote", () => {
  it("結果が無く審議中の説明があればそれをそのまま使う", () => {
    expect(
      buildStatusNote({
        resultLabel: null,
        statusNote: "審議中（9月29日の本会議で採決予定）",
      })
    ).toBe("審議中（9月29日の本会議で採決予定）");
  });

  it("結果も説明も無ければ不明と書く", () => {
    expect(buildStatusNote({ resultLabel: null })).toBe(NO_RESULT_NOTE);
  });

  it("公式ページの結果はそのまま、会議録・中継由来は出典を添える", () => {
    expect(
      buildStatusNote({ resultLabel: "原案可決", resultSource: "official" })
    ).toBe("原案可決");
    expect(buildStatusNote({ resultLabel: "原案可決" })).toBe("原案可決");
    expect(
      buildStatusNote({ resultLabel: "否決", resultSource: "minutes" })
    ).toBe("否決（本会議会議録より自動抽出）");
    expect(
      buildStatusNote({ resultLabel: "原案可決", resultSource: "broadcast" })
    ).toBe("原案可決（本会議の中継映像より）");
  });
});

describe("buildDefaultSummary", () => {
  it("結果あり・審議中・結果不明で文言を出し分ける", () => {
    expect(
      buildDefaultSummary("令和8年（第5回）8月臨時会", "市長提出", {
        resultLabel: "原案可決",
        resolvedDate: "2026-08-10",
      })
    ).toBe(
      "令和8年（第5回）8月臨時会に市長提出から提出され、原案可決となりました。（議決日: 2026-08-10）"
    );
    expect(
      buildDefaultSummary("令和8年（第6回）9月定例会", "市長提出", {
        resultLabel: null,
        statusNote: "審議中（9月29日の本会議で採決予定）",
        resolvedDate: "2026-09-07",
      })
    ).toBe(
      "令和8年（第6回）9月定例会に市長提出から提出され、審議中（9月29日の本会議で採決予定）です。"
    );
    expect(
      buildDefaultSummary("令和元年（第5回）12月定例会", "市長提出", {
        resultLabel: null,
        resolvedDate: "2019-12-19",
      })
    ).toBe(
      "令和元年（第5回）12月定例会に市長提出から提出されました。議決結果は出典ページに記載されていません。"
    );
  });
});
