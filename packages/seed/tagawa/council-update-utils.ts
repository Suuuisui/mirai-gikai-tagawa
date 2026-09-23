/**
 * 市議会データの定期自動更新（GitHub Actions）で使う純粋なロジック【田川市専用】
 *
 * detect-council-changes.ts / update-question-videos.ts / find-unrecorded-videos.ts
 * の main() から切り出したもの。ファイルI/O・ネットワークは持たない。
 * テストは council-update-utils.test.ts
 */

import path from "node:path";
import { billDescriptionKey } from "./bill-descriptions";
import { parseWarekiDate } from "./council-html-utils";
import { buildBillName } from "./session-data-utils";
import type { BillSource, SessionSource } from "./source-data";

/**
 * スクリプト共通の `--out <dir>` 引数（作業ファイルの置き場）を読む。
 * 無ければカレントディレクトリ直下の council-update/
 */
export function parseOutDir(argv: readonly string[]): string {
  const index = argv.indexOf("--out");
  const value = index >= 0 ? argv[index + 1] : undefined;
  return path.resolve(value && !value.startsWith("--") ? value : "council-update");
}

// ---------------------------------------------------------------- 会期・議案

/** 会期データ（sessions.json / ongoing-sessions.json）の前回との差分 */
export interface SessionDiff {
  /** 新しく現れた会期キー */
  added: string[];
  /** 議案や結果が変わった会期キー（議案の並び順の変化も含む） */
  changed: string[];
  /** 無くなった会期キー（通常は起きない。起きたら人が確認する） */
  removed: string[];
}

/** 会期をキーで突き合わせ、追加・変更・削除を返す（順序はキーの昇順） */
export function diffSessions(
  previous: readonly SessionSource[],
  next: readonly SessionSource[]
): SessionDiff {
  const prevByKey = new Map(previous.map((s) => [s.key, JSON.stringify(s)]));
  const nextByKey = new Map(next.map((s) => [s.key, JSON.stringify(s)]));
  const added: string[] = [];
  const changed: string[] = [];
  for (const [key, signature] of nextByKey) {
    const before = prevByKey.get(key);
    if (before === undefined) added.push(key);
    else if (before !== signature) changed.push(key);
  }
  const removed = [...prevByKey.keys()].filter((key) => !nextByKey.has(key));
  return { added: added.sort(), changed: changed.sort(), removed: removed.sort() };
}

/**
 * 公式サイトから取り込めた会期を、手で管理する会期中の一覧から外す。
 * 閉会して「提出議案と議決結果」ページが公開された会期は sessions.json に入るので、
 * ongoing-sessions.json に残したままだと build-csv.ts がキー重複で止まる
 */
export function pruneOngoingSessions(
  ongoing: readonly SessionSource[],
  scraped: readonly SessionSource[]
): { kept: SessionSource[]; pruned: SessionSource[] } {
  const scrapedKeys = new Set(scraped.map((s) => s.key));
  return {
    kept: ongoing.filter((s) => !scrapedKeys.has(s.key)),
    pruned: ongoing.filter((s) => scrapedKeys.has(s.key)),
  };
}

/**
 * 手で置いた会期中の会期と同じ出典ページを持つのにキーが違う会期が取り込まれたら、
 * その旨の警告文を返す（キーが違うと重複を検出できず、同じ会期が二重に公開される）
 */
export function findOngoingKeyMismatches(
  ongoing: readonly SessionSource[],
  scraped: readonly SessionSource[]
): string[] {
  return ongoing.flatMap((session) =>
    scraped
      .filter((s) => s.sourceUrl === session.sourceUrl && s.key !== session.key)
      .map(
        (s) =>
          `会期中の会期 ${session.key}（ongoing-sessions.json）と同じ出典ページの会期が別のキー ${s.key} で取り込まれました。ongoing-sessions.json のキーを直してください`
      )
  );
}

/** レポートに載せる議案の参照 */
export interface BillRef {
  sessionKey: string;
  sessionName: string;
  billNumberLabel: string | null;
  title: string;
}

function billIdentity(sessionKey: string, bill: BillSource): string {
  return billDescriptionKey(sessionKey, bill.billNumberLabel, bill.title, bill.proposer);
}

function collectBillRefs(
  sessions: readonly SessionSource[],
  exclude: ReadonlySet<string>
): BillRef[] {
  return sessions.flatMap((session) =>
    session.bills
      .filter((bill) => !exclude.has(billIdentity(session.key, bill)))
      .map((bill) => ({
        sessionKey: session.key,
        sessionName: session.name,
        billNumberLabel: bill.billNumberLabel,
        title: bill.title,
      }))
  );
}

function billIdentities(sessions: readonly SessionSource[]): Set<string> {
  return new Set(sessions.flatMap((s) => s.bills.map((b) => billIdentity(s.key, b))));
}

/** 前回に無かった議案を、会期の順に列挙する */
export function listNewBills(
  previous: readonly SessionSource[],
  next: readonly SessionSource[]
): BillRef[] {
  return collectBillRefs(next, billIdentities(previous));
}

/**
 * 前回はあったのに無くなった議案（公式ページで番号や提出者の表記が変わったとき等）。
 * 本番DBの行は自動では消えないので、人が確認する
 */
export function listRemovedBills(
  previous: readonly SessionSource[],
  next: readonly SessionSource[]
): BillRef[] {
  return collectBillRefs(previous, billIdentities(next));
}

/** レポート用の1行（会期名（キー）: 議案番号　件名） */
export function formatBillRef(bill: BillRef): string {
  return `${bill.sessionName}（${bill.sessionKey}）: ${buildBillName(bill.billNumberLabel, bill.title)}`;
}

// ---------------------------------------------------------------- 生成済みデータ・CSV

/**
 * 生成済みデータ（petitions-data.ts / general-questions-data.ts）のレコードを
 * id ごとの本文に分ける。Biome 整形後は配列の各要素が
 * `  {` … `  },` の2スペース字下げのブロックになり、id はその中の
 * `    id: "…",` の1行になる（入れ子のオブジェクトに id は無い）
 */
export function extractRecords(generatedSource: string): Map<string, string> {
  const records = new Map<string, string>();
  const lines = generatedSource.split(/\r?\n/);
  let block: string[] | null = null;
  for (const line of lines) {
    if (line === "  {") {
      block = [];
      continue;
    }
    if (block && (line === "  }," || line === "  }")) {
      const idLine = block.find((l) => /^\s+id: "[^"]+",?$/.test(l));
      const id = idLine?.match(/"([^"]+)"/)?.[1];
      if (id) records.set(id, block.join("\n"));
      block = null;
      continue;
    }
    if (block) block.push(line);
  }
  return records;
}

/** 生成済みデータのレコード id の一覧（順序は出現順） */
export function extractRecordIds(generatedSource: string): string[] {
  return [...extractRecords(generatedSource).keys()];
}

/** 生成済みデータの前回との差（追加された id と、中身が変わった id） */
export function diffRecords(
  previousSource: string,
  nextSource: string
): { added: string[]; changed: string[] } {
  const before = extractRecords(previousSource);
  const added: string[] = [];
  const changed: string[] = [];
  for (const [id, body] of extractRecords(nextSource)) {
    const prev = before.get(id);
    if (prev === undefined) added.push(id);
    else if (prev !== body) changed.push(id);
  }
  return { added, changed };
}

/** bill_contents_rows.csv の行のうち、ここで見る列 */
export interface BillContentRow {
  bill_id: string;
  content: string;
}

/** 解説文（bill-descriptions*.ts）がある本文は「## 解説」で始まる */
export function hasDescription(row: Pick<BillContentRow, "content">): boolean {
  return row.content.startsWith("## 解説");
}

/** 本文（解説・議案情報・出典）が前回と変わった議案の id */
export function findChangedBillContents(
  previous: readonly BillContentRow[],
  next: readonly BillContentRow[]
): string[] {
  const before = new Map(previous.map((row) => [row.bill_id, row.content]));
  return next
    .filter((row) => {
      const prev = before.get(row.bill_id);
      return prev !== undefined && prev !== row.content;
    })
    .map((row) => row.bill_id);
}

/**
 * 前回は解説文があったのに無くなった議案の id。
 * 公式ページで件名の表記が変わると解説文のキーが合わなくなり、黙って解説が消えるため
 */
export function findLostDescriptions(
  previous: readonly BillContentRow[],
  next: readonly BillContentRow[]
): string[] {
  const hadDescription = new Set(previous.filter(hasDescription).map((row) => row.bill_id));
  return next
    .filter((row) => hadDescription.has(row.bill_id) && !hasDescription(row))
    .map((row) => row.bill_id);
}

// ---------------------------------------------------------------- 動画

export interface ChannelVideo {
  id: string;
  title: string;
}

/**
 * yt-dlp `--print "%(id)s\t%(title)s"` の出力を動画の配列にする。
 * 環境によってタブが実際のタブ文字ではなく `\t` の2文字で出ることがあるため両方を受け付ける
 */
export function parseVideoListing(output: string): ChannelVideo[] {
  const videos: ChannelVideo[] = [];
  for (const line of output.split(/\r?\n/)) {
    const m = line.match(/^([\w-]{11})(?:\t|\\t)(.+)$/);
    if (m) videos.push({ id: m[1], title: m[2].trim() });
  }
  return videos;
}

/**
 * 既存の一般質問動画リストに、新しく見つかった動画を足す。
 * 既存の並びは保ち、同じ id は足さない。一般質問以外の動画は対象外
 */
export function mergeQuestionVideos(
  existing: readonly ChannelVideo[],
  found: readonly ChannelVideo[]
): { merged: ChannelVideo[]; added: ChannelVideo[] } {
  const known = new Set(existing.map((v) => v.id));
  const added: ChannelVideo[] = [];
  for (const video of found) {
    if (!video.title.includes("一般質問") || known.has(video.id)) continue;
    known.add(video.id);
    added.push(video);
  }
  return { merged: [...existing, ...added], added };
}

/** 委員会記録の中で動画を参照している欄（URL または出典の補足） */
export interface MeetingVideoReference {
  youtube_url: string | null;
  source_note: string | null;
}

/**
 * 公式チャンネルの動画のうち、まだ委員会記録に取り込まれていないものを返す。
 * 一般質問は日ごとの記録の source_note に議員ごとの動画URLを並べているので、
 * URL欄だけでなく source_note も見る
 */
export function findUnrecordedVideos(
  videos: readonly ChannelVideo[],
  references: readonly MeetingVideoReference[]
): ChannelVideo[] {
  const referenced = references
    .flatMap((r) => [r.youtube_url ?? "", r.source_note ?? ""])
    .join("\n");
  return videos.filter((video) => !referenced.includes(video.id));
}

/** 未収録の動画のうち「新しい」とみなす日数（これより古いものは畳んで載せる） */
export const RECENT_VIDEO_DAYS = 90;

/**
 * 動画タイトルの【令和8年9月18日】から日付を読み、直近のものと古いものに分ける。
 * 委員会記録は途中の年度から始めているため古い未収録動画が多く、毎回すべて
 * 列挙すると本当に新しい動画が埋もれる
 */
export function splitVideosByRecency(
  videos: readonly ChannelVideo[],
  today: string,
  days: number = RECENT_VIDEO_DAYS
): { recent: ChannelVideo[]; older: ChannelVideo[] } {
  const threshold = new Date(`${today}T00:00:00Z`);
  threshold.setUTCDate(threshold.getUTCDate() - days);
  const thresholdDate = threshold.toISOString().slice(0, 10);
  const recent: ChannelVideo[] = [];
  const older: ChannelVideo[] = [];
  for (const video of videos) {
    const date = parseWarekiDate(video.title);
    (date && date >= thresholdDate ? recent : older).push(video);
  }
  return { recent, older };
}

// ---------------------------------------------------------------- レポート

export interface RecordDiffSummary {
  added: number;
  changed: number;
}

export interface UpdateReportInput {
  /** 実行日（YYYY-MM-DD、JST） */
  date: string;
  sessions: SessionDiff;
  /** 本番DBへ投入し直す会期キー（会期データの追加・変更・ongoing からの卒業・解説文の更新） */
  changedSessions: string[];
  newBills: BillRef[];
  removedBills: BillRef[];
  /** 解説文（bill-descriptions*.ts）が無い新規議案 */
  billsWithoutDescription: BillRef[];
  /** 解説文が更新された議案の数（bill_contents の本文が変わった既存の議案） */
  updatedBillContents: number;
  /** 前回は解説文があったのに無くなった議案（表示名） */
  lostDescriptions: string[];
  prunedOngoingKeys: string[];
  petitions: RecordDiffSummary;
  questions: RecordDiffSummary;
  addedQuestionVideos: ChannelVideo[];
  unrecordedVideos: ChannelVideo[];
  /** yt-dlp が使えなかった等、確認が必要な警告 */
  warnings: string[];
}

/** データに変化があったか（コミット・投入・デプロイの要否） */
export function hasDataChanges(input: UpdateReportInput): boolean {
  return (
    input.sessions.added.length > 0 ||
    input.sessions.changed.length > 0 ||
    input.sessions.removed.length > 0 ||
    input.changedSessions.length > 0 ||
    input.prunedOngoingKeys.length > 0 ||
    input.petitions.added + input.petitions.changed > 0 ||
    input.questions.added + input.questions.changed > 0 ||
    input.addedQuestionVideos.length > 0
  );
}

/**
 * 人の作業（解説の執筆・会議記録の追加・データの確認）が残っているか。
 * 未収録の動画は直近のものだけを数える（古い動画の山は畳んで載せるだけ）
 */
export function needsHumanFollowUp(input: UpdateReportInput): boolean {
  return (
    input.billsWithoutDescription.length > 0 ||
    input.removedBills.length > 0 ||
    input.lostDescriptions.length > 0 ||
    input.sessions.removed.length > 0 ||
    splitVideosByRecency(input.unrecordedVideos, input.date).recent.length > 0 ||
    input.warnings.length > 0
  );
}

function formatRecordDiff(summary: RecordDiffSummary, unit: string): string {
  return `追加 ${summary.added}${unit}・更新 ${summary.changed}${unit}`;
}

/** GitHub Issue / コミットメッセージに載せる Markdown のレポート */
export function buildUpdateReport(input: UpdateReportInput): string {
  const lines: string[] = [`## 市議会データの自動更新（${input.date}）`, ""];

  const sessionLines: string[] = [];
  if (input.sessions.added.length > 0)
    sessionLines.push(`- 新しい会期: ${input.sessions.added.join("、")}`);
  if (input.sessions.changed.length > 0)
    sessionLines.push(`- 議案や議決結果が更新された会期: ${input.sessions.changed.join("、")}`);
  if (input.prunedOngoingKeys.length > 0)
    sessionLines.push(
      `- 議決結果ページが公開されたため「会期中」の扱いを終えた会期: ${input.prunedOngoingKeys.join("、")}`
    );
  if (input.updatedBillContents > 0)
    sessionLines.push(`- 解説文が更新された議案: ${input.updatedBillContents}件`);
  if (input.changedSessions.length > 0)
    sessionLines.push(`- 本番DBへ投入した会期: ${input.changedSessions.join("、")}`);
  if (input.sessions.removed.length > 0)
    sessionLines.push(`- ⚠️ 公式サイトから消えた会期（要確認）: ${input.sessions.removed.join("、")}`);
  lines.push("### 議案・議決結果");
  lines.push(...(sessionLines.length > 0 ? sessionLines : ["- 変化なし"]));
  if (input.newBills.length > 0) {
    lines.push("", `新しい議案 ${input.newBills.length}件:`);
    lines.push(...input.newBills.map((b) => `- ${formatBillRef(b)}`));
  }
  lines.push("");

  lines.push("### 請願・陳情 / 一般質問");
  lines.push(
    `- 請願・陳情: ${formatRecordDiff(input.petitions, "件")}`,
    `- 一般質問: ${formatRecordDiff(input.questions, "人分")}`,
    `- 一般質問の録画の追加: ${input.addedQuestionVideos.length}本`
  );
  lines.push("");

  const todo: string[] = [];
  if (input.billsWithoutDescription.length > 0) {
    todo.push(
      `#### 解説文がまだ無い議案（${input.billsWithoutDescription.length}件）`,
      "公式ページの事実（件名・提出者・議決結果）だけで公開されています。`packages/seed/tagawa/bill-descriptions*.ts` に解説を書いてマージすると、次の自動更新で本番に反映されます。",
      ...input.billsWithoutDescription.map((b) => `- ${formatBillRef(b)}`),
      ""
    );
  }
  if (input.removedBills.length > 0) {
    todo.push(
      `#### 公式ページから無くなった議案（${input.removedBills.length}件）`,
      "番号や提出者の表記が変わった可能性があります。本番DBの古い行は自動では消えないため、確認して `scripts/upsert-sessions.mjs` の投入内容と admin の議案一覧を見直してください。",
      ...input.removedBills.map((b) => `- ${formatBillRef(b)}`),
      ""
    );
  }
  if (input.lostDescriptions.length > 0) {
    todo.push(
      `#### 解説文が外れた議案（${input.lostDescriptions.length}件）`,
      "件名の表記が変わって `bill-descriptions*.ts` のキーと合わなくなった可能性があります。キーを直してください。",
      ...input.lostDescriptions.map((name) => `- ${name}`),
      ""
    );
  }
  if (input.unrecordedVideos.length > 0) {
    const { recent, older } = splitVideosByRecency(input.unrecordedVideos, input.date);
    todo.push(
      `#### 委員会記録にまだ無い中継動画（直近${RECENT_VIDEO_DAYS}日: ${recent.length}本、それより前: ${older.length}本）`,
      "字幕を取り込んで要約し `scripts/import-committee-meetings.mjs` で追加してください（手順は docs/20260912_1500_最新会期の取り込み_8月臨時会と9月定例会.md）。",
      ...recent.map((v) => `- ${v.title} https://www.youtube.com/watch?v=${v.id}`),
      ...(older.length > 0
        ? [
            "",
            `<details><summary>${RECENT_VIDEO_DAYS}日より前の未収録動画（${older.length}本）</summary>`,
            "",
            ...older.map((v) => `- ${v.title} https://www.youtube.com/watch?v=${v.id}`),
            "",
            "</details>",
          ]
        : []),
      ""
    );
  }
  if (input.warnings.length > 0) {
    todo.push("#### 警告", ...input.warnings.map((w) => `- ${w}`), "");
  }
  lines.push("### 人の作業が必要なこと", ...(todo.length > 0 ? todo : ["- なし", ""]));

  return lines.join("\n").trimEnd().concat("\n");
}

/** コミットメッセージの1行目 */
export function buildCommitSubject(input: UpdateReportInput): string {
  const parts: string[] = [];
  if (input.changedSessions.length > 0) parts.push(`議案 ${input.changedSessions.join("・")}`);
  if (input.petitions.added + input.petitions.changed > 0)
    parts.push(`請願・陳情 ${formatRecordDiff(input.petitions, "件")}`);
  if (input.questions.added + input.questions.changed > 0)
    parts.push(`一般質問 ${formatRecordDiff(input.questions, "人分")}`);
  if (input.addedQuestionVideos.length > 0) parts.push(`録画 ${input.addedQuestionVideos.length}本`);
  return `市議会データの自動更新 ${input.date}: ${parts.join(" / ") || "データ整理"}`;
}
