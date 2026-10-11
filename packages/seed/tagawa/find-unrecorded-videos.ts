/**
 * 委員会記録（committee_meetings）の不足を本番DBと照らして列挙する【田川市専用】
 *
 * 1. 公式YouTubeチャンネルの動画のうち、まだ記録に取り込まれていないもの
 * 2. 会議録検索システムに会議録が載ったのに、中継の文字起こしをもとにしたままの本会議の記録
 *
 * 実行方法:
 *   SUPABASE_URL=… SUPABASE_SECRET_KEY=… \
 *   pnpm --filter @mirai-gikai/seed tagawa:find-unrecorded-videos -- --out <作業ディレクトリ>
 *
 * - 入力は update-question-videos.ts が書いた <out>/channel-videos.json
 * - 結果は <out>/unrecorded-videos.json と <out>/records-awaiting-minutes.json
 *   （detect-council-changes.ts がレポートに載せる）
 * - 会議録の一覧は scrape-minutes-index.ts が書いた data/official-minutes.json
 * - 会議録はあるが順次作り直すと決めた古い記録は data/minutes-rework-backlog.json に置き、
 *   Issue に毎日載らないようにする（作り直したら、その行は消してよい）
 * - 取り込めない動画（自動字幕が無いなど）は data/unrecorded-video-exceptions.json に理由付きで置き、
 *   Issue に毎日載らないようにする。字幕が付くなど事情が変わったら除外を外す
 * - DB の接続情報が無いときは検出を行わず、警告だけ残す
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  type ChannelVideo,
  findRecordsAwaitingMinutes,
  findUnrecordedVideos,
  type MeetingKey,
  type MeetingSourceReference,
  type MeetingVideoReference,
  parseOutDir,
  type RecordAwaitingMinutes,
} from "./council-update-utils";
import { parseStoredMinutesIndex } from "./minutes-index-parser";

const PAGE_SIZE = 1000;
const EXCEPTIONS_PATH = path.join(import.meta.dirname, "data/unrecorded-video-exceptions.json");
const OFFICIAL_MINUTES_PATH = path.join(import.meta.dirname, "data/official-minutes.json");
const MINUTES_BACKLOG_PATH = path.join(import.meta.dirname, "data/minutes-rework-backlog.json");

type MeetingRow = MeetingVideoReference & MeetingSourceReference;

interface VideoException {
  id: string;
  title: string;
  reason: string;
}

function loadExceptionIds(): Set<string> {
  if (!existsSync(EXCEPTIONS_PATH)) return new Set();
  const exceptions = JSON.parse(readFileSync(EXCEPTIONS_PATH, "utf-8")) as VideoException[];
  return new Set(exceptions.map((e) => e.id));
}

function loadMinutesDates(): Set<string> {
  if (!existsSync(OFFICIAL_MINUTES_PATH)) return new Set();
  const { records } = parseStoredMinutesIndex(readFileSync(OFFICIAL_MINUTES_PATH, "utf-8"));
  return new Set(records.map((record) => record.date));
}

function loadMinutesBacklog(): MeetingKey[] {
  if (!existsSync(MINUTES_BACKLOG_PATH)) return [];
  return JSON.parse(readFileSync(MINUTES_BACKLOG_PATH, "utf-8")) as MeetingKey[];
}

async function loadMeetings(): Promise<MeetingRow[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const rows: MeetingRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    // ページをまたいで同じ行を2回読んだり飛ばしたりしないよう、並び順を固定する
    const { data, error } = await supabase
      .from("committee_meetings")
      .select("youtube_url, source_note, committee_name, meeting_date, source_type, headline")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`committee_meetings の取得に失敗: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const videosPath = path.join(outDir, "channel-videos.json");
  const videosResultPath = path.join(outDir, "unrecorded-videos.json");
  const minutesResultPath = path.join(outDir, "records-awaiting-minutes.json");

  let unrecorded: ChannelVideo[] = [];
  let awaitingMinutes: RecordAwaitingMinutes[] = [];
  try {
    const meetings = await loadMeetings();

    if (existsSync(videosPath)) {
      const videos = JSON.parse(readFileSync(videosPath, "utf-8")) as ChannelVideo[];
      const exceptionIds = loadExceptionIds();
      const found = findUnrecordedVideos(videos, meetings);
      unrecorded = found.filter((video) => !exceptionIds.has(video.id));
      console.log(
        `チャンネルの動画${videos.length}本のうち、委員会記録に無いもの${unrecorded.length}本（記録${meetings.length}件と照合、取り込めない動画${found.length - unrecorded.length}本を除外）`
      );
    } else {
      console.log("channel-videos.json が無いため未収録動画の検出は行いません");
    }

    const backlog = loadMinutesBacklog();
    awaitingMinutes = findRecordsAwaitingMinutes(meetings, loadMinutesDates(), backlog);
    console.log(
      `会議録が公開されたのに中継の文字起こしをもとにしたままの本会議の記録: ${awaitingMinutes.length}件（順次作り直す古い記録${backlog.length}件は除外）`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendFileSync(
      path.join(outDir, "warnings.txt"),
      `委員会記録の不足の検出ができませんでした（${message}）\n`,
      "utf-8"
    );
    console.warn(message);
  }
  writeFileSync(videosResultPath, `${JSON.stringify(unrecorded, null, 2)}\n`, "utf-8");
  writeFileSync(minutesResultPath, `${JSON.stringify(awaitingMinutes, null, 2)}\n`, "utf-8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
