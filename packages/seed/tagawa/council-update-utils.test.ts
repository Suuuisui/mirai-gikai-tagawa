import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildCommitSubject,
  buildUpdateReport,
  diffRecords,
  diffSessions,
  extractRecordIds,
  extractRecords,
  findChangedBillContents,
  findLostDescriptions,
  findOngoingKeyMismatches,
  findRecordsAwaitingMinutes,
  findSessionIdsWithChangedBillRows,
  findSessionsAwaitingMinutes,
  findStaleHomepageCuration,
  findStaleOngoingBills,
  findUnrecordedVideos,
  formatBillRef,
  formatMinutesRecord,
  hasDataChanges,
  listNewBills,
  listNewLabelAliases,
  listNewlyOfficialSessionKeys,
  listPendingOfficialBills,
  listRemovedBills,
  mergeQuestionVideos,
  needsHumanFollowUp,
  parseOutDir,
  parseVideoListing,
  splitVideosByRecency,
  type UpdateReportInput,
} from "./council-update-utils";
import type { BillSource, SessionSource } from "./source-data";

function bill(
  label: string | null,
  resultLabel: string | null = "原案可決",
  proposer: BillSource["proposer"] = "mayor"
): BillSource {
  return {
    billNumberLabel: label,
    title: label ? `${label}の件名` : "番号のない件名",
    proposer,
    resultLabel,
    resolvedDate: "2026-09-07",
  };
}

function session(key: string, bills: BillSource[], sourceUrl = `https://example.com/${key}`): SessionSource {
  return { key, name: `会期${key}`, startDate: "2026-09-07", endDate: "2026-10-08", sourceUrl, bills };
}

const r85 = session("r8-5-rinji", [bill("議案第48号")]);
const r86pending = session("r8-6-teirei", [bill("議案第50号", null)]);
const r86decided = session("r8-6-teirei", [bill("議案第50号", "原案可決")]);

describe("parseOutDir", () => {
  it("--out の値を絶対パスにし、無ければ council-update/ を使う", () => {
    expect(parseOutDir(["--out", "/tmp/x"])).toBe("/tmp/x");
    expect(parseOutDir(["--", "--out", "rel"])).toBe(path.resolve("rel"));
    expect(parseOutDir([])).toBe(path.resolve("council-update"));
    expect(parseOutDir(["--out"])).toBe(path.resolve("council-update"));
  });
});

describe("diffSessions", () => {
  it("追加・変更・削除された会期キーを昇順で返す", () => {
    expect(diffSessions([r85, r86pending], [r86decided, session("r8-7-teirei", [])])).toEqual({
      added: ["r8-7-teirei"],
      changed: ["r8-6-teirei"],
      removed: ["r8-5-rinji"],
    });
  });

  it("同じ内容なら差分なし。議案の並びが変わっただけでも変更とみなす", () => {
    expect(diffSessions([r85], [structuredClone(r85)])).toEqual({ added: [], changed: [], removed: [] });
    const two = session("r8-5-rinji", [bill("議案第48号"), bill("議案第49号")]);
    const swapped = session("r8-5-rinji", [bill("議案第49号"), bill("議案第48号")]);
    expect(diffSessions([two], [swapped]).changed).toEqual(["r8-5-rinji"]);
  });

  it("初回（前回が空）はすべて追加になる", () => {
    expect(diffSessions([], [r85, r86pending]).added).toEqual(["r8-5-rinji", "r8-6-teirei"]);
  });
});

describe("findOngoingKeyMismatches", () => {
  it("同じ出典ページなのにキーが違う会期が取り込まれたら警告する", () => {
    const ongoing = session("r8-6-teirei", [], "https://example.com/kiji1");
    const scraped = session("r8-6-rinji", [], "https://example.com/kiji1");
    expect(findOngoingKeyMismatches([ongoing], [scraped])).toEqual([
      "会期中の会期 r8-6-teirei（ongoing-sessions.json）と同じ出典ページの会期が別のキー r8-6-rinji で取り込まれました。ongoing-sessions.json のキーを直してください",
    ]);
    expect(findOngoingKeyMismatches([ongoing], [session("r8-6-teirei", [], "https://example.com/kiji1")])).toEqual([]);
  });
});

describe("listNewBills / listRemovedBills / formatBillRef", () => {
  it("前回に無かった議案だけを会期名つきで返し、番号が無い議案は件名で表示する", () => {
    const next = session("r8-6-teirei", [bill("議案第50号"), bill(null)]);
    const added = listNewBills([r86pending], [next]);
    expect(added).toEqual([
      { sessionKey: "r8-6-teirei", sessionName: "会期r8-6-teirei", billNumberLabel: null, title: "番号のない件名" },
    ]);
    expect(formatBillRef(added[0])).toBe("会期r8-6-teirei（r8-6-teirei）: 番号のない件名");
    expect(formatBillRef({ ...added[0], billNumberLabel: "議案第50号", title: "件名" })).toBe(
      "会期r8-6-teirei（r8-6-teirei）: 議案第50号　件名"
    );
  });

  it("同じ番号でも提出者が違えば別の議案として数え、無くなった議案も返す", () => {
    const prev = session("r8-6-teirei", [bill("議案第50号", "原案可決", "mayor")]);
    const next = session("r8-6-teirei", [bill("議案第50号", "原案可決", "member")]);
    expect(listNewBills([prev], [next]).map((b) => b.billNumberLabel)).toEqual(["議案第50号"]);
    expect(listRemovedBills([prev], [next]).map((b) => b.billNumberLabel)).toEqual(["議案第50号"]);
    expect(listRemovedBills([prev], [prev])).toEqual([]);
  });
});

describe("extractRecords / extractRecordIds / diffRecords", () => {
  const before = [
    "export const X: readonly PetitionRecord[] = [",
    "  {",
    '    id: "a-1",',
    '    status: "pending",',
    '    introducers: [{ name: "id: \\"not-a-record\\"" }],',
    "  },",
    "];",
    "",
  ].join("\n");
  const after = [
    "export const X: readonly PetitionRecord[] = [",
    "  {",
    '    id: "a-1",',
    '    status: "adopted",',
    "    introducers: [],",
    "  },",
    "  {",
    '    id: "a-2",',
    '    status: "pending",',
    "  },",
    "];",
    "",
  ].join("\n");

  it("整形済みデータをレコード id ごとの本文に分ける（入れ子の id らしき文字列は無視）", () => {
    expect(extractRecordIds(after)).toEqual(["a-1", "a-2"]);
    expect(extractRecords(before).get("a-1")).toContain('status: "pending"');
  });

  it("追加された id と中身が変わった id を返す。改行が CRLF でも読める", () => {
    expect(diffRecords(before, after)).toEqual({ added: ["a-2"], changed: ["a-1"] });
    expect(diffRecords(before.replace(/\n/g, "\r\n"), after)).toEqual({ added: ["a-2"], changed: ["a-1"] });
    expect(diffRecords("", "")).toEqual({ added: [], changed: [] });
  });
});

describe("findChangedBillContents / findLostDescriptions", () => {
  const prev = [
    { bill_id: "b1", content: "## 解説\n本文\n## 議案情報" },
    { bill_id: "b2", content: "## 議案情報" },
  ];

  it("本文が変わった既存の議案の id を返す（新規は含めない）", () => {
    const next = [
      { bill_id: "b1", content: "## 解説\n直した本文\n## 議案情報" },
      { bill_id: "b2", content: "## 議案情報" },
      { bill_id: "b3", content: "## 議案情報" },
    ];
    expect(findChangedBillContents(prev, next)).toEqual(["b1"]);
  });

  it("前回は解説があったのに無くなった議案の id を返す", () => {
    const next = [
      { bill_id: "b1", content: "## 議案情報" },
      { bill_id: "b2", content: "## 解説\n新しく書いた\n## 議案情報" },
    ];
    expect(findLostDescriptions(prev, next)).toEqual(["b1"]);
  });
});

describe("parseVideoListing / mergeQuestionVideos", () => {
  it("タブ区切りと \\t の2文字の両方を読み取り、壊れた行や短い id は無視する", () => {
    expect(
      parseVideoListing(
        "abcDEF12345\t【令和8年9月9日】山野義人議員　一般質問 \r\nzzzzzzzzzzz\\t委員会の中継\n壊れた行\nshortid\tタイトル\n"
      )
    ).toEqual([
      { id: "abcDEF12345", title: "【令和8年9月9日】山野義人議員　一般質問" },
      { id: "zzzzzzzzzzz", title: "委員会の中継" },
    ]);
    expect(parseVideoListing("")).toEqual([]);
  });

  it("一般質問の動画だけを、既存の並びを保って足す（重複は1回だけ）", () => {
    const { merged, added } = mergeQuestionVideos(
      [{ id: "old00000000", title: "【令和8年6月17日】一般質問 A" }],
      [
        { id: "old00000000", title: "【令和8年6月17日】一般質問 A" },
        { id: "new00000000", title: "【令和8年9月9日】一般質問 B" },
        { id: "new00000000", title: "【令和8年9月9日】一般質問 B" },
        { id: "cmt00000000", title: "総務文教委員会" },
      ]
    );
    expect(added.map((v) => v.id)).toEqual(["new00000000"]);
    expect(merged.map((v) => v.id)).toEqual(["old00000000", "new00000000"]);
    expect(mergeQuestionVideos([], []).merged).toEqual([]);
  });
});

describe("findUnrecordedVideos", () => {
  const videos = [
    { id: "aaaaaaaaaaa", title: "A" },
    { id: "bbbbbbbbbbb", title: "B" },
    { id: "ccccccccccc", title: "C" },
  ];

  it("URL欄にも出典の補足にも出てこない動画だけを返す", () => {
    expect(
      findUnrecordedVideos(videos, [
        { youtube_url: "https://www.youtube.com/watch?v=aaaaaaaaaaa", source_note: null },
        { youtube_url: null, source_note: "動画: https://www.youtube.com/watch?v=bbbbbbbbbbb" },
      ]).map((v) => v.id)
    ).toEqual(["ccccccccccc"]);
  });

  it("記録が1件も無ければ全部が未収録", () => {
    expect(findUnrecordedVideos(videos, [])).toEqual(videos);
  });
});

describe("splitVideosByRecency", () => {
  it("タイトルの和暦の日付で直近と古い動画に分け、日付が読めないものは古い扱い", () => {
    const { recent, older } = splitVideosByRecency(
      [
        { id: "a", title: "【令和8年9月18日】田川市議会　議会運営委員会" },
        { id: "b", title: "【令和8年3月4日】田川市議会３月定例会" },
        { id: "c", title: "日付のない動画" },
        { id: "d", title: "【令和８年６月２５日】厚生委員会" },
      ],
      "2026-09-23"
    );
    expect(recent.map((v) => v.id)).toEqual(["a", "d"]);
    expect(older.map((v) => v.id)).toEqual(["b", "c"]);
  });

  it("ちょうど日数分前の日は直近、その1日前は古い扱い", () => {
    const { recent, older } = splitVideosByRecency(
      [
        { id: "edge", title: "【令和8年6月25日】A" },
        { id: "out", title: "【令和8年6月24日】B" },
      ],
      "2026-09-23"
    );
    expect(recent.map((v) => v.id)).toEqual(["edge"]);
    expect(older.map((v) => v.id)).toEqual(["out"]);
  });
});

describe("buildUpdateReport / hasDataChanges / needsHumanFollowUp / buildCommitSubject", () => {
  const base: UpdateReportInput = {
    date: "2026-10-09",
    sessions: { added: [], changed: [], removed: [] },
    changedSessions: [],
    newBills: [],
    removedBills: [],
    billsWithoutDescription: [],
    updatedBillContents: 0,
    lostDescriptions: [],
    prunedOngoingKeys: [],
    pendingOfficialBills: [],
    staleOngoingBills: [],
    newLabelAliases: [],
    petitions: { added: 0, changed: 0 },
    questions: { added: 0, changed: 0 },
    addedQuestionVideos: [],
    unrecordedVideos: [],
    newOfficialMinutes: [],
    officialMinutesIndexChanged: false,
    recordsAwaitingMinutes: [],
    sessionsAwaitingMinutes: [],
    staleHomepageCuration: null,
    warnings: [],
  };
  const ref = { sessionKey: "r8-6-teirei", sessionName: "9月定例会", billNumberLabel: "認定第1号", title: "決算" };

  it("変化が無ければ「変化なし」「なし」のレポートになり、コミットも人の作業も不要", () => {
    const report = buildUpdateReport(base);
    expect(report).toContain("- 変化なし");
    expect(report).toContain("### 人の作業が必要なこと\n- なし");
    expect(hasDataChanges(base)).toBe(false);
    expect(needsHumanFollowUp(base)).toBe(false);
    expect(buildCommitSubject(base)).toBe("市議会データの自動更新 2026-10-09: データ整理");
  });

  it("新しい議案・未収録の動画があれば作業リストに載り、古い動画は畳んで載せる", () => {
    const input: UpdateReportInput = {
      ...base,
      sessions: { added: [], changed: ["r8-6-teirei"], removed: [] },
      changedSessions: ["r8-6-teirei"],
      newBills: [ref],
      billsWithoutDescription: [ref],
      prunedOngoingKeys: ["r8-6-teirei"],
      petitions: { added: 1, changed: 2 },
      addedQuestionVideos: [{ id: "vvvvvvvvvvv", title: "録画" }],
      unrecordedVideos: [
        { id: "uuuuuuuuuuu", title: "【令和8年9月29日】本会議" },
        { id: "ooooooooooo", title: "【令和7年3月19日】田川市議会 3月定例会" },
      ],
    };
    const report = buildUpdateReport(input);
    expect(report).toContain("議案や議決結果が更新された会期: r8-6-teirei");
    expect(report).toContain("公式の結果に切り替えた会期: r8-6-teirei");
    expect(report).toContain("本番DBへ投入した会期: r8-6-teirei");
    expect(report).toContain("- 請願・陳情: 追加 1件・更新 2件");
    expect(report).toContain("解説文がまだ無い議案（1件）");
    expect(report).toContain("- 9月定例会（r8-6-teirei）: 認定第1号　決算");
    expect(report).toContain("委員会記録にまだ無い中継動画（直近90日: 1本、それより前: 1本）");
    expect(report).toContain("- 【令和8年9月29日】本会議 https://www.youtube.com/watch?v=uuuuuuuuuuu");
    expect(report).toContain("<details><summary>90日より前の未収録動画（1本）</summary>");
    expect(report).toContain("https://www.youtube.com/watch?v=ooooooooooo");
    expect(hasDataChanges(input)).toBe(true);
    expect(needsHumanFollowUp(input)).toBe(true);
    expect(buildCommitSubject(input)).toBe(
      "市議会データの自動更新 2026-10-09: 議案 r8-6-teirei / 請願・陳情 追加 1件・更新 2件 / 録画 1本"
    );
  });

  it("古い未収録動画だけなら人の作業は不要とみなし、<details> も出ない", () => {
    const input = { ...base, unrecordedVideos: [{ id: "ooooooooooo", title: "【令和7年3月19日】3月定例会" }] };
    expect(needsHumanFollowUp(input)).toBe(false);
    expect(buildUpdateReport(input)).toContain("直近90日: 0本、それより前: 1本");
    expect(buildUpdateReport({ ...base, unrecordedVideos: [{ id: "uuuuuuuuuuu", title: "【令和8年9月29日】本会議" }] })).not.toContain(
      "<details>"
    );
  });

  it("消えた会期・消えた議案・外れた解説文・警告は人の確認が必要", () => {
    expect(needsHumanFollowUp({ ...base, sessions: { added: [], changed: [], removed: ["r1-5-teirei"] } })).toBe(true);
    expect(needsHumanFollowUp({ ...base, removedBills: [ref] })).toBe(true);
    expect(needsHumanFollowUp({ ...base, lostDescriptions: ["議案第50号　補正予算"] })).toBe(true);
    const warned = { ...base, warnings: ["yt-dlp が使えませんでした"] };
    expect(hasDataChanges(warned)).toBe(false);
    expect(needsHumanFollowUp(warned)).toBe(true);
    const report = buildUpdateReport({
      ...warned,
      sessions: { added: [], changed: [], removed: ["r1-5-teirei"] },
      removedBills: [ref],
      lostDescriptions: ["議案第50号　補正予算"],
    });
    expect(report).toContain("⚠️ 公式サイトから消えた会期（要確認）: r1-5-teirei");
    expect(report).toContain("公式ページから無くなった議案（1件）");
    expect(report).toContain("解説文が外れた議案（1件）\n");
    expect(report).toContain("#### 警告\n- yt-dlp が使えませんでした");
  });

  it("公式ページにまだ載っていない議案と、番号表記の読み替えを報告する", () => {
    const report = buildUpdateReport({
      ...base,
      prunedOngoingKeys: ["r8-6-teirei"],
      pendingOfficialBills: [ref],
      newLabelAliases: ["r8-6-teirei: 議案第62号 → 議員提出議案第62号"],
    });
    expect(report).toContain("議決結果ページが公開され、公式の結果に切り替えた会期: r8-6-teirei");
    expect(report).toContain("公式の議決結果ページにまだ載っていない議案: 1件");
    expect(report).toContain("<details><summary>公式の議決結果ページにまだ載っていない議案</summary>");
    expect(report).toContain("読み替えた議案（URLを変えないため）: r8-6-teirei: 議案第62号 → 議員提出議案第62号");
    // 読み替えファイルが増えたらコミットが要る。載っていない議案があるだけなら人の作業は増えない
    expect(hasDataChanges({ ...base, newLabelAliases: ["x"] })).toBe(true);
    expect(needsHumanFollowUp({ ...base, pendingOfficialBills: [ref] })).toBe(false);
  });

  it("新しく公開された会議録と、会議録で作り直す記録・解説を作業リストに載せる", () => {
    const minutes = {
      date: "2026-06-12",
      fileName: "R080612A",
      sessionName: "令和8年 第4回定例会",
      dayLabel: "第1日",
    };
    const input: UpdateReportInput = {
      ...base,
      newOfficialMinutes: [minutes],
      recordsAwaitingMinutes: [
        { committeeName: "本会議", meetingDate: "2026-06-12", headline: "選挙費を即日可決" },
        { committeeName: "本会議（一般質問）", meetingDate: "2026-06-17", headline: null },
      ],
      sessionsAwaitingMinutes: [
        { sessionKey: "r8-4-teirei", sessionName: "令和8年（第4回）6月定例会", billCount: 24 },
      ],
    };
    const report = buildUpdateReport(input);

    expect(report).toContain("- 新しく公開された会議録: 1日分\n  - 令和8年 第4回定例会 第1日（2026-06-12）");
    expect(report).toContain("会議録が公開された本会議の記録（2件）");
    expect(report).toContain("- 2026-06-12 本会議: 選挙費を即日可決");
    expect(report).toContain("- 2026-06-17 本会議（一般質問）\n");
    expect(report).toContain("会議録が公開された会期の議案の解説（1会期）");
    expect(report).toContain("- 令和8年（第4回）6月定例会（r8-4-teirei）: 24件");
    expect(buildCommitSubject(input)).toBe("市議会データの自動更新 2026-10-09: 会議録 1日分");
    // 会議録が増えたらコミットが要り、作り直しが残っている間は Issue を開いたままにする
    expect(hasDataChanges({ ...base, newOfficialMinutes: [minutes] })).toBe(true);
    expect(needsHumanFollowUp({ ...base, recordsAwaitingMinutes: input.recordsAwaitingMinutes })).toBe(true);
    expect(needsHumanFollowUp({ ...base, sessionsAwaitingMinutes: input.sessionsAwaitingMinutes })).toBe(true);
    // 会議録が増えただけ（作り直す記録も解説も無い）なら人の作業は増えない
    expect(needsHumanFollowUp({ ...base, newOfficialMinutes: [minutes] })).toBe(false);
    expect(buildUpdateReport(base)).toContain("- 新しく公開された会議録: なし");
  });

  it("新しい会議録が多いときは、新しい順に上限まで載せて残りは件数だけにする", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      fileName: `R0801${String(i + 1).padStart(2, "0")}A`,
      sessionName: "令和8年 第1回臨時会",
      dayLabel: `第${i + 1}日`,
    }));
    const report = buildUpdateReport({ ...base, newOfficialMinutes: many });

    expect(report).toContain("- 新しく公開された会議録: 25日分\n  - 令和8年 第1回臨時会 第25日（2026-01-25）");
    expect(report).toContain("  - 令和8年 第1回臨時会 第6日（2026-01-06）\n  - ほか5日分");
    expect(report).not.toContain("第5日（2026-01-05）");
  });

  it("閉会から日がたっても会期中データに残る議案は、人が確かめる作業として載せる", () => {
    const input: UpdateReportInput = { ...base, staleOngoingBills: [ref] };
    const report = buildUpdateReport(input);

    expect(report).toContain("閉会から14日たっても公式ページに載らない議案（1件）");
    expect(report).toContain("- 9月定例会（r8-6-teirei）: 認定第1号　決算");
    expect(needsHumanFollowUp(input)).toBe(true);
  });

  it("会議録の一覧が書き換わっただけ（リンク用コードの変更など）でもコミットは必要", () => {
    expect(hasDataChanges({ ...base, officialMinutesIndexChanged: true })).toBe(true);
  });

  it("ongoing から外れただけ、解説文の更新だけでもコミットは必要", () => {
    expect(hasDataChanges({ ...base, prunedOngoingKeys: ["r8-6-teirei"] })).toBe(true);
    expect(hasDataChanges({ ...base, changedSessions: ["r8-6-teirei"], updatedBillContents: 3 })).toBe(true);
    expect(buildUpdateReport({ ...base, changedSessions: ["r8-6-teirei"], updatedBillContents: 3 })).toContain(
      "解説文が更新された議案: 3件"
    );
  });
});

describe("トップページの注目・固定のレポート", () => {
  const base: UpdateReportInput = {
    date: "2026-12-01",
    sessions: { added: [], changed: [], removed: [] },
    changedSessions: [],
    newBills: [],
    removedBills: [],
    billsWithoutDescription: [],
    updatedBillContents: 0,
    lostDescriptions: [],
    prunedOngoingKeys: [],
    pendingOfficialBills: [],
    staleOngoingBills: [],
    newLabelAliases: [],
    petitions: { added: 0, changed: 0 },
    questions: { added: 0, changed: 0 },
    addedQuestionVideos: [],
    unrecordedVideos: [],
    newOfficialMinutes: [],
    officialMinutesIndexChanged: false,
    recordsAwaitingMinutes: [],
    sessionsAwaitingMinutes: [],
    staleHomepageCuration: null,
    warnings: [],
  };

  it("前の会期のままの枠があれば人の作業として載せ、無ければ載せない", () => {
    const input: UpdateReportInput = {
      ...base,
      staleHomepageCuration: {
        sessionKey: "r8-7-teirei",
        sessionName: "令和8年（第7回）12月定例会",
        slots: ["注目の議案（3件）", "タグ「予算」の固定（3件）"],
      },
    };
    const report = buildUpdateReport(input);
    expect(report).toContain("#### トップページの注目・固定が前の会期のまま");
    expect(report).toContain("最新の会期（令和8年（第7回）12月定例会）の議案が");
    expect(report).toContain("- 注目の議案（3件）\n- タグ「予算」の固定（3件）");
    expect(needsHumanFollowUp(input)).toBe(true);
    // データの変化ではないので、コミット・デプロイはしない
    expect(hasDataChanges(input)).toBe(false);

    expect(buildUpdateReport(base)).not.toContain("トップページの注目・固定");
    expect(needsHumanFollowUp(base)).toBe(false);
  });
});

describe("findStaleHomepageCuration", () => {
  const sessions = [
    { id: "s-sep", key: "r8-6-teirei", name: "9月定例会", startDate: "2026-09-07" },
    { id: "s-dec", key: "r8-7-teirei", name: "12月定例会", startDate: "2026-12-01" },
    { id: "s-old", key: "r8-2-teirei", name: "3月定例会", startDate: "2026-02-19" },
  ];
  const septemberBills = [
    { id: "sep-budget", sessionId: "s-sep", tagIds: ["tag-budget"] },
    { id: "sep-ordinance", sessionId: "s-sep", tagIds: ["tag-ordinance"] },
    { id: "sep-settlement", sessionId: "s-sep", tagIds: ["tag-settlement"] },
  ];
  const decemberBills = [
    { id: "dec-budget", sessionId: "s-dec", tagIds: ["tag-budget"] },
    { id: "dec-ordinance", sessionId: "s-dec", tagIds: ["tag-ordinance"] },
  ];
  const curation = {
    featuredBillIds: ["sep-settlement", "sep-budget"],
    tags: [
      { id: "tag-budget", label: "予算", pinnedBillIds: ["sep-budget"] },
      { id: "tag-ordinance", label: "条例", pinnedBillIds: [] },
      { id: "tag-settlement", label: "決算", pinnedBillIds: ["sep-settlement"] },
    ],
  };

  it("最新の会期の議案が注目にも固定にも入っていなければ、その枠を返す", () => {
    expect(
      findStaleHomepageCuration(curation, sessions, [...septemberBills, ...decemberBills])
    ).toEqual({
      sessionKey: "r8-7-teirei",
      sessionName: "12月定例会",
      // 条例は固定が無く自動で選ばれる。決算は最新の会期に決算の議案が無い
      slots: ["注目の議案（2件）", "タグ「予算」の固定（1件）"],
    });
  });

  it("最新の会期の議案が1件でも入っている枠は返さず、どの枠も入っていれば null", () => {
    const updated = {
      featuredBillIds: ["dec-budget", "sep-settlement"],
      tags: [
        { id: "tag-budget", label: "予算", pinnedBillIds: ["sep-budget", "dec-budget"] },
        { id: "tag-settlement", label: "決算", pinnedBillIds: ["sep-settlement"] },
      ],
    };
    expect(
      findStaleHomepageCuration(updated, sessions, [...septemberBills, ...decemberBills])
    ).toBeNull();
  });

  it("最新の会期は議案のある会期から決める（議案の無い会期は数えない）", () => {
    // 12月定例会の議案がまだ無いうちは、9月定例会が最新なので前の会期のままとは言わない
    expect(findStaleHomepageCuration(curation, sessions, septemberBills)).toBeNull();
  });

  it("注目も固定も無ければ、何も返さない", () => {
    expect(
      findStaleHomepageCuration(
        { featuredBillIds: [], tags: [{ id: "tag-budget", label: "予算", pinnedBillIds: [] }] },
        sessions,
        [...septemberBills, ...decemberBills]
      )
    ).toBeNull();
    expect(findStaleHomepageCuration(curation, sessions, [])).toBeNull();
  });
});

describe("findRecordsAwaitingMinutes", () => {
  const minutesDates = new Set(["2026-06-12", "2026-06-17", "2026-03-04"]);
  const meeting = (committee_name: string, meeting_date: string, source_type: string) => ({
    committee_name,
    meeting_date,
    source_type,
    headline: `${meeting_date}の見出し`,
  });

  it("会議録が載った日の、文字起こしがもとの本会議の記録だけを古い順に返す", () => {
    expect(
      findRecordsAwaitingMinutes(
        [
          meeting("本会議（一般質問）", "2026-06-17", "youtube"),
          meeting("本会議", "2026-06-12", "youtube"),
          // 会議録がまだ無い日
          meeting("本会議", "2026-09-07", "youtube"),
          // すでに会議録をもとにした記録
          meeting("本会議", "2026-03-04", "minutes"),
          // 委員会の会議録は会議録検索システムに載らない
          meeting("議会運営委員会", "2026-06-12", "youtube"),
        ],
        minutesDates
      )
    ).toEqual([
      { committeeName: "本会議", meetingDate: "2026-06-12", headline: "2026-06-12の見出し" },
      { committeeName: "本会議（一般質問）", meetingDate: "2026-06-17", headline: "2026-06-17の見出し" },
    ]);
  });

  it("順次作り直すと決めた記録は除く（同じ日でも会議が違えば除かない）", () => {
    const meetings = [
      meeting("本会議", "2026-03-04", "youtube"),
      meeting("本会議（一般質問）", "2026-03-04", "youtube"),
    ];

    expect(
      findRecordsAwaitingMinutes(meetings, minutesDates, [
        { committeeName: "本会議", meetingDate: "2026-03-04" },
      ]).map((r) => r.committeeName)
    ).toEqual(["本会議（一般質問）"]);
  });

  it("時刻つきの開催日でも日付で照らす", () => {
    expect(
      findRecordsAwaitingMinutes([meeting("本会議", "2026-06-12T00:00:00+00:00", "youtube")], minutesDates)
    ).toHaveLength(1);
  });

  it("記録が無ければ空", () => {
    expect(findRecordsAwaitingMinutes([], minutesDates)).toEqual([]);
  });
});

describe("findSessionsAwaitingMinutes / formatMinutesRecord", () => {
  const sessions = [
    { key: "r8-4-teirei", name: "6月定例会" },
    { key: "r8-5-rinji", name: "8月臨時会" },
    { key: "r8-2-teirei", name: "3月定例会" },
  ];
  const minutesDates = new Set(["2026-03-18", "2026-06-12", "2026-07-01"]);

  it("議決日の会議録が公開されたのに、解説が会議録をもとにしていない議案を会期ごとに数える", () => {
    const bills = new Map([
      [
        "r8-4-teirei",
        [
          { source: "explanation-materials", resolvedDate: "2026-06-12" },
          { source: "broadcast", resolvedDate: "2026-07-01" },
          { source: "minutes", resolvedDate: "2026-07-01" },
          { source: null, resolvedDate: "2026-07-01" },
        ] as const,
      ],
      // 会議録がまだ無い会期は、中継がもとのままでも対象にしない
      ["r8-5-rinji", [{ source: "broadcast", resolvedDate: "2026-08-10" }] as const],
      // すべて会議録がもとの会期
      ["r8-2-teirei", [{ source: "minutes", resolvedDate: "2026-03-18" }] as const],
    ]);

    expect(findSessionsAwaitingMinutes(sessions, bills, minutesDates)).toEqual([
      { sessionKey: "r8-4-teirei", sessionName: "6月定例会", billCount: 2 },
    ]);
  });

  it("会期の途中の日の会議録だけが公開されても、まだ会議録が無い日に議決された議案は数えない", () => {
    const bills = new Map([
      [
        "r8-4-teirei",
        [
          { source: "broadcast", resolvedDate: "2026-06-12" },
          { source: "broadcast", resolvedDate: "2026-07-01" },
        ] as const,
      ],
    ]);

    expect(findSessionsAwaitingMinutes(sessions, bills, new Set(["2026-06-12"]))).toEqual([
      { sessionKey: "r8-4-teirei", sessionName: "6月定例会", billCount: 1 },
    ]);
  });

  it("議案の情報が無い会期や、会議録が1日も無いときは空", () => {
    expect(findSessionsAwaitingMinutes(sessions, new Map(), minutesDates)).toEqual([]);
    expect(
      findSessionsAwaitingMinutes(
        sessions,
        new Map([["r8-4-teirei", [{ source: "broadcast", resolvedDate: "2026-07-01" }] as const]]),
        new Set()
      )
    ).toEqual([]);
  });

  it("会議録1日分を会議名・日目・日付の1行にする", () => {
    expect(
      formatMinutesRecord({
        date: "2026-06-12",
        fileName: "R080612A",
        sessionName: "令和8年 第4回定例会",
        dayLabel: "第1日",
      })
    ).toBe("令和8年 第4回定例会 第1日（2026-06-12）");
  });
});

describe("listNewlyOfficialSessionKeys / listPendingOfficialBills / findStaleOngoingBills", () => {
  const leftover = session("r8-6-teirei", [bill("認定第1号", null)]);

  it("会期中だった会期の公式ページを初めて取り込めたときだけ、その会期を返す", () => {
    expect(listNewlyOfficialSessionKeys([r85], [r86pending], [r85, r86decided])).toEqual(["r8-6-teirei"]);
    // 前回すでに公式ページがあった会期（未掲載の議案だけが残っている）は含めない
    expect(listNewlyOfficialSessionKeys([r85, r86decided], [leftover], [r85, r86decided])).toEqual([]);
    // 公式ページがまだ無い会期も含めない
    expect(listNewlyOfficialSessionKeys([r85], [r86pending], [r85])).toEqual([]);
  });

  it("公式ページがある会期の、まだ載っていない議案だけを返す", () => {
    const notYetOfficial = session("r8-7-teirei", [bill("議案第70号", null)]);

    expect(listPendingOfficialBills([leftover, notYetOfficial], [r85, r86decided])).toEqual([
      {
        sessionKey: "r8-6-teirei",
        sessionName: "会期r8-6-teirei",
        billNumberLabel: "認定第1号",
        title: "認定第1号の件名",
      },
    ]);
    expect(listPendingOfficialBills([], [r85])).toEqual([]);
  });

  it("閉会から14日を過ぎても会期中データに残る議案を返す（ちょうど14日目までは待つ）", () => {
    // session() の会期は 10月8日まで
    expect(findStaleOngoingBills([leftover], "2026-10-22")).toEqual([]);
    expect(findStaleOngoingBills([leftover], "2026-10-23").map((b) => b.billNumberLabel)).toEqual([
      "認定第1号",
    ]);
    expect(findStaleOngoingBills([], "2026-12-01")).toEqual([]);
  });
});

describe("listNewLabelAliases", () => {
  const alias = {
    sessionKey: "r8-6-teirei",
    proposer: "member" as const,
    officialLabel: "議案第62号",
    label: "議員提出議案第62号",
  };

  it("前回に無かった読み替えだけを「会期: 公式の表記 → 使い続ける表記」で返す", () => {
    const added = { ...alias, officialLabel: "議案第65号", label: "議員提出議案第65号" };

    expect(listNewLabelAliases([alias], [alias, added])).toEqual([
      "r8-6-teirei: 議案第65号 → 議員提出議案第65号",
    ]);
    expect(listNewLabelAliases([alias], [alias])).toEqual([]);
  });

  it("同じ番号でも提出者や会期が違えば別の読み替えとして数える", () => {
    expect(listNewLabelAliases([alias], [{ ...alias, proposer: "committee" }])).toHaveLength(1);
    expect(listNewLabelAliases([alias], [{ ...alias, sessionKey: "r8-7-teirei" }])).toHaveLength(1);
  });
});

describe("findSessionIdsWithChangedBillRows", () => {
  const row = (id: string, sessionId: string, statusNote = "原案可決") => ({
    id,
    diet_session_id: sessionId,
    name: `議案${id}`,
    status_note: statusNote,
  });

  it("行が増えた会期と、行の中身が変わった会期を返す", () => {
    const previous = [row("a", "s1"), row("b", "s2"), row("c", "s3")];
    const next = [
      row("a", "s1"),
      row("b", "s2", "否決"),
      row("c", "s3"),
      row("d", "s4"),
    ];

    expect(findSessionIdsWithChangedBillRows(previous, next).sort()).toEqual(["s2", "s4"]);
  });

  it("同じ会期で複数の行が変わっても会期は1回だけ返す", () => {
    const previous = [row("a", "s1"), row("b", "s1")];
    const next = [row("a", "s1", "同意"), row("b", "s1", "同意"), row("c", "s1")];

    expect(findSessionIdsWithChangedBillRows(previous, next)).toEqual(["s1"]);
  });

  it("変化が無ければ空。行が減っただけの会期は返さない（本番の行は自動では消えない）", () => {
    const rows = [row("a", "s1"), row("b", "s2")];

    expect(findSessionIdsWithChangedBillRows(rows, rows.map((r) => ({ ...r })))).toEqual([]);
    expect(findSessionIdsWithChangedBillRows(rows, [row("a", "s1")])).toEqual([]);
  });
});
