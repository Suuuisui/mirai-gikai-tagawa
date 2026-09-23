/**
 * 公式YouTubeチャンネルの動画のうち、委員会記録（committee_meetings）にまだ
 * 取り込まれていないものを列挙する【田川市専用】
 *
 * 実行方法:
 *   SUPABASE_URL=… SUPABASE_SECRET_KEY=… \
 *   pnpm --filter @mirai-gikai/seed tagawa:find-unrecorded-videos -- --out <作業ディレクトリ>
 *
 * - 入力は update-question-videos.ts が書いた <out>/channel-videos.json
 * - 結果は <out>/unrecorded-videos.json（detect-council-changes.ts がレポートに載せる）
 * - 取り込めない動画（自動字幕が無いなど）は data/unrecorded-video-exceptions.json に理由付きで置き、
 *   Issue に毎日載らないようにする。字幕が付くなど事情が変わったら除外を外す
 * - DB の接続情報が無いときは検出を行わず、警告だけ残す
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  type ChannelVideo,
  findUnrecordedVideos,
  type MeetingVideoReference,
  parseOutDir,
} from "./council-update-utils";

const PAGE_SIZE = 1000;
const EXCEPTIONS_PATH = path.join(import.meta.dirname, "data/unrecorded-video-exceptions.json");

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

async function loadMeetingReferences(): Promise<MeetingVideoReference[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const rows: MeetingVideoReference[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    // ページをまたいで同じ行を2回読んだり飛ばしたりしないよう、並び順を固定する
    const { data, error } = await supabase
      .from("committee_meetings")
      .select("youtube_url, source_note")
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
  const resultPath = path.join(outDir, "unrecorded-videos.json");

  if (!existsSync(videosPath)) {
    console.log("channel-videos.json が無いため未収録動画の検出は行いません");
    writeFileSync(resultPath, "[]\n", "utf-8");
    return;
  }
  const videos = JSON.parse(readFileSync(videosPath, "utf-8")) as ChannelVideo[];

  let unrecorded: ChannelVideo[] = [];
  try {
    const references = await loadMeetingReferences();
    const exceptionIds = loadExceptionIds();
    const found = findUnrecordedVideos(videos, references);
    unrecorded = found.filter((video) => !exceptionIds.has(video.id));
    console.log(
      `チャンネルの動画${videos.length}本のうち、委員会記録に無いもの${unrecorded.length}本（記録${references.length}件と照合、取り込めない動画${found.length - unrecorded.length}本を除外）`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendFileSync(
      path.join(outDir, "warnings.txt"),
      `未収録動画の検出ができませんでした（${message}）\n`,
      "utf-8"
    );
    console.warn(message);
  }
  writeFileSync(resultPath, `${JSON.stringify(unrecorded, null, 2)}\n`, "utf-8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
