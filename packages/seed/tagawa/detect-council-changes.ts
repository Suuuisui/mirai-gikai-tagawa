/**
 * 定期自動更新で、スクレイパー実行後にデータがどう変わったかを検出し、
 * コミットメッセージ・GitHub Issue 用のレポートと、後続ステップの判断材料を書き出す
 * 【田川市専用】
 *
 * 実行方法（各スクレイパーと tagawa:build-csv の実行後、コミット前に）:
 *   pnpm --filter @mirai-gikai/seed tagawa:detect-changes -- --out <作業ディレクトリ>
 *
 * 比較の基準は git の HEAD（コミット済みの内容）。書き出すもの:
 *   <out>/report.md          … 変更点と人の作業が必要なことの一覧（Issue 本文・コミット本文）
 *   <out>/commit-subject.txt … コミットメッセージの1行目
 *   <out>/outputs.env        … has_changes / needs_follow_up / changed_sessions（Actions の出力用）
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseBillSources } from "@mirai-gikai/shared/council/bill-source-section";
import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";
import { parse } from "csv-parse/sync";
import {
  type BillContentRow,
  type BillDescriptionState,
  type BillRef,
  buildCommitSubject,
  buildUpdateReport,
  type ChannelVideo,
  diffRecords,
  diffSessions,
  findChangedBillContents,
  findLostDescriptions,
  findOngoingKeyMismatches,
  findSessionIdsWithChangedBillRows,
  findSessionsAwaitingMinutes,
  findStaleOngoingBills,
  hasDataChanges,
  hasDescription,
  listNewBills,
  listNewLabelAliases,
  listNewlyOfficialSessionKeys,
  listPendingOfficialBills,
  listRemovedBills,
  needsHumanFollowUp,
  parseOutDir,
  type RecordAwaitingMinutes,
  type UpdateReportInput,
} from "./council-update-utils";
import { diffMinutesRecords, parseStoredMinutesIndex } from "./minutes-index-parser";
import {
  type BillLabelAlias,
  buildBillName,
  mergeSessions,
} from "./session-data-utils";
import type { SessionSource } from "./source-data";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const SESSIONS_PATH = "packages/seed/tagawa/data/sessions.json";
const ONGOING_PATH = "packages/seed/tagawa/data/ongoing-sessions.json";
const LABEL_ALIASES_PATH = "packages/seed/tagawa/data/bill-label-aliases.json";
const OFFICIAL_MINUTES_PATH = "packages/seed/tagawa/data/official-minutes.json";
const VIDEOS_PATH = "packages/seed/tagawa/data/question-videos.json";
const PETITIONS_PATH = "web/src/features/petitions/shared/data/petitions-data.ts";
const QUESTIONS_PATH = "web/src/features/general-questions/shared/data/general-questions-data.ts";
const CSV_DIR = "packages/seed/csv/data";

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * コミット済みの内容。HEAD にそのパスが無いとき（初回実行・新規ファイル）だけ空文字にし、
 * git 自体の失敗（リポジトリ外で実行した等）はそのまま止める。
 * 「無いから空」と「壊れているから空」を混ぜると、全会期が新規扱いになって本番へ大量投入してしまう
 */
function readCommitted(relativePath: string): string {
  try {
    git(["cat-file", "-e", `HEAD:${relativePath}`]);
  } catch {
    return "";
  }
  return git(["show", `HEAD:${relativePath}`]);
}

function readWorking(relativePath: string): string {
  const full = path.join(REPO_ROOT, relativePath);
  return existsSync(full) ? readFileSync(full, "utf-8") : "";
}

function parseSessions(json: string): SessionSource[] {
  return json.trim() === "" ? [] : (JSON.parse(json) as SessionSource[]);
}

function parseLabelAliases(json: string): BillLabelAlias[] {
  return json.trim() === "" ? [] : (JSON.parse(json) as BillLabelAlias[]);
}

/** 会議録の一覧（data/official-minutes.json）。まだ無いとき（初回）は空 */
function parseMinutes(json: string): OfficialMinutesRecord[] {
  return json.trim() === "" ? [] : parseStoredMinutesIndex(json).records;
}

function parseVideos(json: string): ChannelVideo[] {
  return json.trim() === "" ? [] : (JSON.parse(json) as ChannelVideo[]);
}

function parseCsv(text: string): Record<string, string>[] {
  return text.trim() === "" ? [] : parse(text, { columns: true, skip_empty_lines: true });
}

function readCsvRows(file: string, source: "committed" | "working"): Record<string, string>[] {
  const relativePath = `${CSV_DIR}/${file}`;
  return parseCsv(source === "committed" ? readCommitted(relativePath) : readWorking(relativePath));
}

/** 生成済み CSV から議案 → 本番DBの id を引くための表 */
interface CsvIndex {
  sessionIdBySlug: Map<string, string>;
  slugBySessionId: Map<string, string>;
  billIdByName: Map<string, string>;
  billById: Map<string, { name: string; sessionId: string }>;
  /** bills_rows.csv の行そのまま（行の増減・変化の検出用） */
  billRows: Record<string, string>[];
  contents: BillContentRow[];
  contentById: Map<string, string>;
}

function buildCsvIndex(source: "committed" | "working"): CsvIndex {
  const sessions = readCsvRows("diet_sessions_rows.csv", source);
  const bills = readCsvRows("bills_rows.csv", source);
  const contents = readCsvRows("bill_contents_rows.csv", source).map((r) => ({
    bill_id: r.bill_id,
    content: r.content,
  }));
  return {
    sessionIdBySlug: new Map(sessions.map((r) => [r.slug, r.id])),
    slugBySessionId: new Map(sessions.map((r) => [r.id, r.slug])),
    billIdByName: new Map(bills.map((r) => [`${r.diet_session_id}|${r.name}`, r.id])),
    billById: new Map(bills.map((r) => [r.id, { name: r.name, sessionId: r.diet_session_id }])),
    billRows: bills,
    contents,
    contentById: new Map(contents.map((row) => [row.bill_id, row.content])),
  };
}

function findBillId(index: CsvIndex, bill: BillRef): string | undefined {
  const sessionId = index.sessionIdBySlug.get(bill.sessionKey);
  return sessionId
    ? index.billIdByName.get(`${sessionId}|${buildBillName(bill.billNumberLabel, bill.title)}`)
    : undefined;
}

function todayInJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  const prevSessions = parseSessions(readCommitted(SESSIONS_PATH));
  const nextSessions = parseSessions(readWorking(SESSIONS_PATH));
  const prevOngoing = parseSessions(readCommitted(ONGOING_PATH));
  const nextOngoing = parseSessions(readWorking(ONGOING_PATH));
  // 同じ会期が両方にあるとき（公式ページが会期の途中で公開され、最終日の議案がまだ
  // 載っていないとき）は1つの会期に合わせてから比べる
  const prevAll = mergeSessions(prevSessions, prevOngoing);
  const nextAll = mergeSessions(nextSessions, nextOngoing);

  const sessions = diffSessions(prevAll, nextAll);
  const prunedOngoingKeys = listNewlyOfficialSessionKeys(prevSessions, prevOngoing, nextSessions);
  const newLabelAliases = listNewLabelAliases(
    parseLabelAliases(readCommitted(LABEL_ALIASES_PATH)),
    parseLabelAliases(readWorking(LABEL_ALIASES_PATH))
  );

  const prevCsv = buildCsvIndex("committed");
  const nextCsv = buildCsvIndex("working");
  const newBills = listNewBills(prevAll, nextAll);
  const billsWithoutDescription = newBills.filter((bill) => {
    const billId = findBillId(nextCsv, bill);
    const row = billId ? nextCsv.contents.find((c) => c.bill_id === billId) : undefined;
    return !(row && hasDescription(row));
  });

  // 解説文（bill-descriptions*.ts）の更新は CSV の本文の変化として現れる。
  // その議案の会期も本番DBへ投入し直す対象に含める
  const changedContentIds = findChangedBillContents(prevCsv.contents, nextCsv.contents);
  const sessionsWithChangedContents = new Set(
    changedContentIds.flatMap((id) => {
      const sessionId = nextCsv.billById.get(id)?.sessionId;
      const slug = sessionId ? nextCsv.slugBySessionId.get(sessionId) : undefined;
      return slug ? [slug] : [];
    })
  );
  // 議案の行（bills_rows.csv）が増えた・変わった会期。会期データを PR で先にコミットしたときは
  // 上の会期データの比較に差が出ないので、CSV の行からも拾う
  const sessionsWithChangedBillRows = findSessionIdsWithChangedBillRows(
    prevCsv.billRows,
    nextCsv.billRows
  ).flatMap((sessionId) => {
    const slug = nextCsv.slugBySessionId.get(sessionId);
    return slug ? [slug] : [];
  });
  const changedSessions = [
    ...new Set([
      ...sessions.added,
      ...sessions.changed,
      ...prunedOngoingKeys,
      ...sessionsWithChangedContents,
      ...sessionsWithChangedBillRows,
    ]),
  ].sort();

  const prevVideos = parseVideos(readCommitted(VIDEOS_PATH));
  const nextVideos = parseVideos(readWorking(VIDEOS_PATH));
  const knownVideoIds = new Set(prevVideos.map((v) => v.id));

  // 会議録検索システムの本会議の会議録。新しく載った日と、載ったのに記録・解説が
  // 中継の文字起こしなどをもとにしたままのものを拾う
  const nextMinutes = parseMinutes(readWorking(OFFICIAL_MINUTES_PATH));
  const newOfficialMinutes = diffMinutesRecords(
    parseMinutes(readCommitted(OFFICIAL_MINUTES_PATH)),
    nextMinutes
  );
  const minutesDates = new Set(nextMinutes.map((record) => record.date));
  // 議案ごとの解説の典拠（本文の「## 出典」から読む）と議決日
  const descriptionStates = new Map<string, BillDescriptionState[]>();
  for (const session of nextAll) {
    descriptionStates.set(
      session.key,
      session.bills.flatMap((bill) => {
        const billId = findBillId(nextCsv, {
          sessionKey: session.key,
          sessionName: session.name,
          billNumberLabel: bill.billNumberLabel,
          title: bill.title,
        });
        const content = billId ? nextCsv.contentById.get(billId) : undefined;
        return content === undefined
          ? []
          : [
              {
                source: parseBillSources(content)?.descriptionSource ?? null,
                resolvedDate: bill.resolvedDate,
              },
            ];
      })
    );
  }
  const awaitingMinutesPath = path.join(outDir, "records-awaiting-minutes.json");

  const unrecordedPath = path.join(outDir, "unrecorded-videos.json");
  const warningsPath = path.join(outDir, "warnings.txt");
  const petitions = diffRecords(readCommitted(PETITIONS_PATH), readWorking(PETITIONS_PATH));
  const questions = diffRecords(readCommitted(QUESTIONS_PATH), readWorking(QUESTIONS_PATH));

  const input: UpdateReportInput = {
    date: todayInJst(),
    sessions,
    changedSessions,
    newBills,
    removedBills: listRemovedBills(prevAll, nextAll),
    billsWithoutDescription,
    updatedBillContents: changedContentIds.length,
    lostDescriptions: findLostDescriptions(prevCsv.contents, nextCsv.contents).map(
      (id) => nextCsv.billById.get(id)?.name ?? id
    ),
    prunedOngoingKeys,
    pendingOfficialBills: listPendingOfficialBills(nextOngoing, nextSessions),
    staleOngoingBills: findStaleOngoingBills(nextOngoing, todayInJst()),
    newLabelAliases,
    petitions: { added: petitions.added.length, changed: petitions.changed.length },
    questions: { added: questions.added.length, changed: questions.changed.length },
    addedQuestionVideos: nextVideos.filter((v) => !knownVideoIds.has(v.id)),
    unrecordedVideos: existsSync(unrecordedPath)
      ? (JSON.parse(readFileSync(unrecordedPath, "utf-8")) as ChannelVideo[])
      : [],
    newOfficialMinutes,
    officialMinutesIndexChanged:
      readCommitted(OFFICIAL_MINUTES_PATH) !== readWorking(OFFICIAL_MINUTES_PATH),
    recordsAwaitingMinutes: existsSync(awaitingMinutesPath)
      ? (JSON.parse(readFileSync(awaitingMinutesPath, "utf-8")) as RecordAwaitingMinutes[])
      : [],
    sessionsAwaitingMinutes: findSessionsAwaitingMinutes(nextAll, descriptionStates, minutesDates),
    warnings: [
      ...(existsSync(warningsPath)
        ? readFileSync(warningsPath, "utf-8").split("\n").filter((line) => line.trim() !== "")
        : []),
      ...findOngoingKeyMismatches(nextOngoing, nextSessions),
    ],
  };

  const report = buildUpdateReport(input);
  writeFileSync(path.join(outDir, "report.md"), report, "utf-8");
  writeFileSync(path.join(outDir, "commit-subject.txt"), `${buildCommitSubject(input)}\n`, "utf-8");
  writeFileSync(
    path.join(outDir, "outputs.env"),
    [
      `has_changes=${hasDataChanges(input)}`,
      `needs_follow_up=${needsHumanFollowUp(input)}`,
      `changed_sessions=${changedSessions.join(" ")}`,
      "",
    ].join("\n"),
    "utf-8"
  );
  console.log(report);
  console.log(
    `has_changes=${hasDataChanges(input)} needs_follow_up=${needsHumanFollowUp(input)} changed_sessions=${changedSessions.join(" ") || "(none)"}`
  );
}

main();
