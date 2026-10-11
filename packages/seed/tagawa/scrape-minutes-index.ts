/**
 * 田川市議会「会議録検索システム」の本会議録の一覧づくり【田川市専用】
 *
 * 会議録検索システム（https://www.kensakusystem.jp/tagawa/index.html）の閲覧ツリーを
 * たどり、本会議の会議録がどの日の分まで公開されているか（開催日・会議名・何日目・
 * ファイル名）を集める。委員会の会議録は載っていない。結果は
 *   - packages/seed/tagawa/data/official-minutes.json（前回分の保存。次回の差分づくりに使う）
 *   - web/src/features/official-minutes/shared/data/official-minutes-data.ts
 * に書き出す。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-minutes-index             # 今年と前年だけ取り直す（日本時間）
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-minutes-index -- --all    # 平成10年から今年まで全部（約5分）
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-minutes-index -- --years 2025,2026
 *
 * - アクセス間隔は1.5秒（http-utils の共通スロットル）。キャッシュは使わない（毎回最新を見る）
 * - 取り直さなかった年は、前回の data/official-minutes.json のまま残す
 * - 安全弁（毎朝の自動更新を止めず、かつサイト側の不調で一覧を壊さない）:
 *   - 取り直した年のリクエストが途中で失敗したら、その年は前回のまま残して警告する
 *   - 会議または会議録が1つも取れなかった年が、前回は記録のある年だったら、
 *     サイト側の不調とみなして前回のまま残して警告する
 *   - 全体で1件も取れなかったら、何も書き換えずに警告だけ出して終了コード 0 で終わる
 *   - 保存した一覧（JSON）の形が崩れているときだけは、上書きで他の年を失わないよう異常終了する
 * - 環境変数 COUNCIL_UPDATE_OUT_DIR があれば、警告をその中の warnings.txt にも書き足す
 *   （毎朝の自動更新のレポートに載せるため）
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  OFFICIAL_MINUTES_BASE_URL,
  OFFICIAL_MINUTES_SYSTEM_NAME,
  OFFICIAL_MINUTES_TOP_URL,
} from "@mirai-gikai/shared/council/official-minutes";
import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";
import { writeGeneratedData } from "./generated-data-writer";
import { waitForRateLimit } from "./http-utils";
import {
  buildTreeRequestBody,
  bytesToLatin1,
  decideYearReplacement,
  diffMinutesRecords,
  encodeYearLabelToSjisBytes,
  latin1ToBytes,
  mergeMinutesRecords,
  minutesYearLabels,
  normalizeSessionName,
  parseMinutesDays,
  parseSessionDepths,
  parseSiteCode,
  parseStoredMinutesIndex,
  resolveTargetYears,
  type StoredMinutesIndex,
  toMinutesRecords,
} from "./minutes-index-parser";

const DATA_PATH = path.join(import.meta.dirname, "data/official-minutes.json");
const OUT_PATH =
  "web/src/features/official-minutes/shared/data/official-minutes-data.ts";
const SEE_URL = `${OFFICIAL_MINUTES_BASE_URL}/cgi-bin3/See.exe`;

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const RETRY_WAIT_MS = 5_000;
/** 標準出力に一覧表示する、新しく増えた会議録の最大件数（初回の全件取得で何百行も出さない） */
const MAX_LISTED_RECORDS = 40;

/** 実行中に出した警告（最後にまとめて再掲する） */
const warnings: string[] = [];

function warn(message: string): void {
  warnings.push(message);
  console.warn(`警告: ${message}`);
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
  return `${error.message}${cause}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Shift_JIS の応答を文字列にする */
function decodeSjis(bytes: Uint8Array): string {
  return new TextDecoder("shift_jis").decode(bytes);
}

/**
 * 1.5秒間隔を守りつつリクエストし、失敗したら少し待ってやり直す。
 * 毎回最新を見るのでキャッシュはしない
 */
async function requestBytes(
  description: string,
  request: () => Promise<Response>
): Promise<Buffer> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await waitForRateLimit();
      const res = await request();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw new Error(`${description}: ${describeError(error)}`);
      }
      console.warn(
        `  ${description}: ${attempt}回目に失敗（${describeError(error)}）。${RETRY_WAIT_MS / 1000}秒待ってやり直します`
      );
      await sleep(RETRY_WAIT_MS);
    }
  }
}

/** トップページのリンクから、以降のリクエストに要るコードを読む */
async function fetchSiteCode(): Promise<string> {
  const bytes = await requestBytes("トップページ", () =>
    fetch(OFFICIAL_MINUTES_TOP_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  );
  const code = parseSiteCode(decodeSjis(bytes));
  if (!code)
    throw new Error("トップページからコード（Code=…）を読み取れません");
  return code;
}

/** 閲覧ツリーに POST する。treedepth は Shift_JIS のバイト列で送る */
function postTree(
  code: string,
  description: string,
  treedepthBytes: readonly number[]
): Promise<Buffer> {
  return requestBytes(description, () =>
    fetch(SEE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildTreeRequestBody(code, treedepthBytes),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  );
}

interface YearCrawl {
  year: number;
  /** その年に見つかった会議（定例会・臨時会）の数 */
  sessionCount: number;
  records: OfficialMinutesRecord[];
  /** リクエストが途中で失敗した（取りこぼしがあるかもしれない） */
  failed: boolean;
}

/** 1年分（年ラベルごとに 会議の一覧 → 会議ごとの日別リンク）をたどる */
async function crawlYear(code: string, year: number): Promise<YearCrawl> {
  const records: OfficialMinutesRecord[] = [];
  let sessionCount = 0;
  try {
    for (const label of minutesYearLabels(year)) {
      const labelBytes = encodeYearLabelToSjisBytes(label);
      const yearPage = await postTree(code, `${label}の会議一覧`, labelBytes);
      const depths = parseSessionDepths(
        yearPage.toString("latin1"),
        bytesToLatin1(labelBytes)
      );
      for (const depth of depths) {
        // 会議の値は、サイトが書いてきた Shift_JIS のバイト列のまま送り返す
        const sessionName = normalizeSessionName(
          decodeSjis(Buffer.from(depth, "latin1"))
        );
        const sessionPage = await postTree(
          code,
          `${sessionName}の日別一覧`,
          latin1ToBytes(depth)
        );
        const { records: dayRecords, skippedFileNames } = toMinutesRecords(
          sessionName,
          parseMinutesDays(decodeSjis(sessionPage))
        );
        if (skippedFileNames.length > 0) {
          warn(
            `${sessionName}: 開催日が読めないファイル名を飛ばしました: ${skippedFileNames.join(", ")}`
          );
        }
        if (dayRecords.length === 0) {
          warn(`${sessionName}: 会議録のリンクが1つも見つかりませんでした`);
        }
        console.log(`  ${sessionName}: ${dayRecords.length}日分`);
        sessionCount += 1;
        records.push(...dayRecords);
      }
    }
  } catch (error) {
    warn(`${year}年の取得に失敗しました（${describeError(error)}）`);
    return { year, sessionCount, records: [], failed: true };
  }
  return { year, sessionCount, records, failed: false };
}

/** 前回の保存分を読む（無ければ null。形が崩れていれば例外にして、上書きを防ぐ） */
function loadStoredIndex(): StoredMinutesIndex | null {
  if (!existsSync(DATA_PATH)) return null;
  try {
    return parseStoredMinutesIndex(readFileSync(DATA_PATH, "utf-8"));
  } catch (error) {
    throw new Error(`${DATA_PATH} を読み取れません: ${describeError(error)}`);
  }
}

function countRecordsInYear(
  records: readonly OfficialMinutesRecord[],
  year: number
): number {
  return records.filter((record) => record.date.startsWith(`${year}-`)).length;
}

function formatRecord(record: OfficialMinutesRecord): string {
  return `${record.date} ${record.sessionName} ${record.dayLabel}（${record.fileName}）`;
}

function printRecordList(
  title: string,
  records: OfficialMinutesRecord[]
): void {
  if (records.length === 0) return;
  console.log(`${title}（${records.length}件）:`);
  for (const record of records.slice(0, MAX_LISTED_RECORDS)) {
    console.log(`  ${formatRecord(record)}`);
  }
  if (records.length > MAX_LISTED_RECORDS) {
    console.log(`  …ほか${records.length - MAX_LISTED_RECORDS}件`);
  }
}

/**
 * 警告をまとめて再掲する。毎朝の自動更新では COUNCIL_UPDATE_OUT_DIR（作業ディレクトリ）の
 * warnings.txt にも足し、Issue のレポートに載るようにする（サイトの不調で一覧の更新が
 * 止まったことに気づけるように）
 */
function printWarningSummary(): void {
  if (warnings.length === 0) return;
  console.warn(`警告 ${warnings.length}件:`);
  for (const message of warnings) console.warn(`  - ${message}`);
  const outDir = process.env.COUNCIL_UPDATE_OUT_DIR;
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    appendFileSync(
      path.join(outDir, "warnings.txt"),
      warnings.map((message) => `会議録の一覧: ${message}\n`).join(""),
      "utf-8"
    );
  }
}

async function main() {
  const years = resolveTargetYears(process.argv.slice(2), new Date());
  const stored = loadStoredIndex();
  const previous = stored?.records ?? [];
  console.log(
    `前回の保存: ${previous.length}件 / 取り直す年: ${years.length === 1 ? years[0] : `${years[0]}〜${years.at(-1)}（${years.length}年）`}`
  );

  let code: string;
  try {
    code = await fetchSiteCode();
  } catch (error) {
    warn(
      `会議録検索システムに接続できません。何も書き換えません（${describeError(error)}）`
    );
    printWarningSummary();
    return;
  }
  if (stored && stored.code !== code) {
    console.log(`コードが変わりました: ${stored.code} → ${code}`);
  }

  const crawled: OfficialMinutesRecord[] = [];
  const replacedYears: number[] = [];
  let obtained = 0;
  for (const year of years) {
    console.log(`${year}年`);
    const result = await crawlYear(code, year);
    obtained += result.records.length;
    const decision = decideYearReplacement({
      failed: result.failed,
      sessionCount: result.sessionCount,
      recordCount: result.records.length,
      previousRecordCount: countRecordsInYear(previous, year),
    });
    if (decision === "keep-empty") {
      warn(
        `${year}年: 会議（${result.sessionCount}件）・会議録（${result.records.length}件）が取れませんでした。サイト側の不調とみなして前回の記録を残します`
      );
    }
    if (decision === "replace") {
      replacedYears.push(year);
      crawled.push(...result.records);
    }
  }

  if (obtained === 0) {
    warn("会議録が1件も取れませんでした。何も書き換えません");
    printWarningSummary();
    return;
  }

  const merged = mergeMinutesRecords(previous, crawled, replacedYears);
  const added = diffMinutesRecords(previous, merged);
  const removed = diffMinutesRecords(merged, previous);
  if (removed.length > 0) {
    warn(
      `前回あって今回は見つからなかった会議録が${removed.length}件あります（一覧から外します）: ${removed
        .slice(0, 5)
        .map((record) => record.fileName)
        .join(", ")}${removed.length > 5 ? " …" : ""}`
    );
  }

  // 保存する項目と並びを固定する（JSON の差分を安定させる）
  const storedRecords = merged.map(
    ({ date, fileName, sessionName, dayLabel }) => ({
      date,
      fileName,
      sessionName,
      dayLabel,
    })
  );
  writeFileSync(
    DATA_PATH,
    `${JSON.stringify({ code, records: storedRecords }, null, 2)}\n`,
    "utf-8"
  );

  const first = storedRecords[0].date;
  const last = storedRecords[storedRecords.length - 1].date;
  const outPath = writeGeneratedData({
    relativePath: OUT_PATH,
    exportName: "OFFICIAL_MINUTES",
    typeName: "OfficialMinutesRecord",
    header: [
      "生成コマンド: pnpm --filter @mirai-gikai/seed tagawa:scrape-minutes-index",
      `出典: ${OFFICIAL_MINUTES_SYSTEM_NAME} ${OFFICIAL_MINUTES_TOP_URL}`,
      `${storedRecords.length}件（${first}〜${last}）`,
    ],
    constants: { OFFICIAL_MINUTES_CODE: code },
    data: storedRecords,
  });

  printRecordList("新しく増えた会議録", added);
  console.log(
    `増えた ${added.length}件 / 外れた ${removed.length}件 / 合計 ${storedRecords.length}件（${first}〜${last}）`
  );
  console.log(`wrote ${DATA_PATH}`);
  console.log(`wrote ${outPath} (${storedRecords.length} records)`);
  printWarningSummary();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
