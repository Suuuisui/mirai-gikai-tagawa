/**
 * 公式YouTubeチャンネルの動画一覧を yt-dlp で取得し、一般質問の録画を
 * data/question-videos.json に追記する【田川市専用】
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:update-question-videos -- --out <作業ディレクトリ>
 *
 * - チャンネルは data/question-video-channels.json（年度ごとに別チャンネル。新年度は追加する）
 * - yt-dlp の場所は環境変数 YT_DLP で指定できる（既定は PATH 上の yt-dlp）
 * - yt-dlp が無い・取得に失敗したチャンネルは警告として <out>/warnings.txt に書き、
 *   既存の一覧はそのまま残す（定期実行で YouTube 側の都合に振り回されないため）
 * - 取得できた全動画は <out>/channel-videos.json に書き、find-unrecorded-videos.ts が使う
 */

import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  type ChannelVideo,
  mergeQuestionVideos,
  parseOutDir,
  parseVideoListing,
} from "./council-update-utils";

const CHANNELS_PATH = path.join(import.meta.dirname, "data/question-video-channels.json");
const VIDEOS_PATH = path.join(import.meta.dirname, "data/question-videos.json");
const YT_DLP = process.env.YT_DLP ?? "yt-dlp";

interface Channel {
  label: string;
  url: string;
}

/**
 * execFileSync の失敗理由を1行にする。終了コード付きの失敗は message が
 * 「Command failed: yt-dlp …」で原因が分からないため、stderr の最後の行を使う
 */
function describeCommandError(error: unknown): string {
  const stderr =
    typeof error === "object" && error !== null && "stderr" in error
      ? String((error as { stderr?: unknown }).stderr ?? "")
      : "";
  const lastStderrLine = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .at(-1);
  if (lastStderrLine) return lastStderrLine;
  return String(error instanceof Error ? error.message : error).split("\n")[0];
}

function listChannelVideos(channel: Channel): ChannelVideo[] {
  const output = execFileSync(
    YT_DLP,
    [
      "--flat-playlist",
      "--extractor-args",
      "youtube:lang=ja",
      "--print",
      "%(id)s\t%(title)s",
      channel.url,
    ],
    { encoding: "utf-8", timeout: 240_000, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }
  );
  return parseVideoListing(output);
}

function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const channels = JSON.parse(readFileSync(CHANNELS_PATH, "utf-8")) as Channel[];
  const existing = JSON.parse(readFileSync(VIDEOS_PATH, "utf-8")) as ChannelVideo[];

  const allVideos: ChannelVideo[] = [];
  const warnings: string[] = [];
  for (const channel of channels) {
    try {
      const videos = listChannelVideos(channel);
      console.log(`${channel.label}: ${videos.length}本`);
      allVideos.push(...videos);
    } catch (error) {
      warnings.push(
        `yt-dlp で「${channel.label}」の動画一覧を取得できませんでした（${describeCommandError(error)}）。このチャンネルの分は、一般質問の録画リンクも未収録動画の検出も今回は更新していません`
      );
      console.warn(`  ${channel.label}: 取得失敗 ${describeCommandError(error)}`);
    }
  }

  const { merged, added } = mergeQuestionVideos(existing, allVideos);
  if (added.length > 0) {
    writeFileSync(VIDEOS_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  }
  console.log(`一般質問の録画: 既存${existing.length}本 / 追加${added.length}本`);

  writeFileSync(
    path.join(outDir, "channel-videos.json"),
    `${JSON.stringify(allVideos, null, 2)}\n`,
    "utf-8"
  );
  if (warnings.length > 0) {
    appendFileSync(path.join(outDir, "warnings.txt"), `${warnings.join("\n")}\n`, "utf-8");
  }
}

main();
