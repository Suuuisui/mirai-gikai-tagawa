import { describe, expect, it } from "vitest";
import {
  buildBillName,
  buildDefaultSummary,
  buildSourceSection,
  buildStatusNote,
  carryOverMissingSessions,
  mergeSessions,
  NO_RESULT_NOTE,
  pickActiveSessionKey,
} from "./session-data-utils";
import type { SessionSource } from "./source-data";

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

  it("同じ会期が両方にあれば、消す先を示して止める", () => {
    expect(() =>
      mergeSessions(
        [session("r8-6-teirei", "2026-09-07")],
        [session("r8-6-teirei", "2026-09-07")]
      )
    ).toThrow(/ongoing-sessions\.json から削除/);
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

describe("buildSourceSection", () => {
  const base = {
    sessionName: "令和8年（第6回）9月定例会",
    sourceUrl: "https://example.com/r8-6",
    isOngoing: false,
    descriptionSource: null,
    resultSource: undefined,
  } as const;

  it("解説が無い議案は公式ページのリンクと転記のみの注記だけ", () => {
    expect(buildSourceSection(base)).toEqual([
      "## 出典",
      "",
      "- [田川市議会「令和8年（第6回）9月定例会の提出議案と議決結果」](https://example.com/r8-6)（福岡県田川市公式サイト）",
      "",
      "※ この内容は田川市議会事務局が公開する情報を基に事実のみを転記したものです。分かりやすい解説文のAIによる生成は行っていません。",
    ]);
  });

  it("会期中の会期は公式ページの題名を「提出議案」にする", () => {
    expect(buildSourceSection({ ...base, isOngoing: true })[2]).toContain(
      "9月定例会の提出議案」"
    );
  });

  it("会議録ベースの解説と会議録由来の結果は、それぞれの箇条書きを添える", () => {
    const lines = buildSourceSection({
      ...base,
      descriptionSource: "minutes",
      resultSource: "minutes",
    });

    expect(lines[3]).toMatch(/^- \[田川市議会 会議録検索システム\]/);
    expect(lines[4]).toMatch(/^- 議決結果は\[田川市議会 会議録検索システム\]/);
    expect(lines.at(-1)).toMatch(/^※ 上記の解説は、田川市議会 会議録検索システム/);
  });

  it("中継ベースの解説は説明資料と中継の両方を出典に挙げる", () => {
    const lines = buildSourceSection({
      ...base,
      descriptionSource: "broadcast",
      resultSource: "broadcast",
    });

    expect(lines[3]).toContain("議案説明資料（PDF）");
    expect(lines[4]).toContain("公式YouTubeチャンネル");
    expect(lines[5]).toContain("中継映像で確認したものです");
    expect(lines.at(-1)).toContain("中継映像（自動字幕）をもとに");
  });
});
