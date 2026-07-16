/**
 * 田川市公式サイト向けの共通フェッチ・キャッシュ・HTMLユーティリティ【田川市専用】
 *
 * `scrape.ts`（提出議案と議決結果ページのスクレイパー）と
 * `scrape-explanation-materials.ts`（議員提出資料PDFリンクのスクレイパー）の
 * 両方から利用する。1.5秒間隔ルールとキャッシュ機構をここに集約し、
 * 公共サイトへの負荷配慮ロジックが重複・乖離しないようにする。
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export const CACHE_DIR =
  process.env.TAGAWA_CACHE_DIR ?? path.join(import.meta.dirname, ".cache");
export const FETCH_INTERVAL_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastFetchAt = 0;

/**
 * 1.5秒間隔ルールを守るための共通スロットル。
 * `fetchWithCache` と、会議録検索システム向けの `fetchSjisWithCache`
 * （`scrape.ts`）の両方から呼び出し、対象ホストが異なっても
 * プロセス全体で1リクエスト/1.5秒を超えないようにする。
 */
export async function waitForRateLimit(): Promise<void> {
  const wait = lastFetchAt + FETCH_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastFetchAt = Date.now();
}

/** 1.5秒間隔ルールを守りつつHTTP GETし、結果をキャッシュする */
export async function fetchWithCache(
  url: string,
  cacheName: string
): Promise<string> {
  const cachePath = path.join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }
  await waitForRateLimit();
  console.log(`fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const body = await res.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, body, "utf-8");
  return body;
}

export const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function decodeEntities(s: string): string {
  return s.replace(/&[a-z]+;|&#\d+;/g, (m) => ENTITIES[m] ?? " ");
}

/** 全角数字を半角へ */
export function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}
