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
  findUnrecordedVideos,
  formatBillRef,
  hasDataChanges,
  listNewBills,
  listRemovedBills,
  mergeQuestionVideos,
  needsHumanFollowUp,
  parseOutDir,
  parseVideoListing,
  pruneOngoingSessions,
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

describe("pruneOngoingSessions / findOngoingKeyMismatches", () => {
  it("取り込み済みの会期を会期中の一覧から外す（外すものが無ければそのまま）", () => {
    const { kept, pruned } = pruneOngoingSessions([r86pending, session("r8-7-teirei", [])], [r86decided]);
    expect(kept.map((s) => s.key)).toEqual(["r8-7-teirei"]);
    expect(pruned.map((s) => s.key)).toEqual(["r8-6-teirei"]);
    expect(pruneOngoingSessions([r86pending], [r85])).toEqual({ kept: [r86pending], pruned: [] });
  });

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
    petitions: { added: 0, changed: 0 },
    questions: { added: 0, changed: 0 },
    addedQuestionVideos: [],
    unrecordedVideos: [],
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
    expect(report).toContain("「会期中」の扱いを終えた会期: r8-6-teirei");
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

  it("ongoing から外れただけ、解説文の更新だけでもコミットは必要", () => {
    expect(hasDataChanges({ ...base, prunedOngoingKeys: ["r8-6-teirei"] })).toBe(true);
    expect(hasDataChanges({ ...base, changedSessions: ["r8-6-teirei"], updatedBillContents: 3 })).toBe(true);
    expect(buildUpdateReport({ ...base, changedSessions: ["r8-6-teirei"], updatedBillContents: 3 })).toContain(
      "解説文が更新された議案: 3件"
    );
  });
});
