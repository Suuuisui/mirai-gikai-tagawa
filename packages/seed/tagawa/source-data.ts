/**
 * 田川市議会 実データ（会期・議案）の型定義とローダー
 *
 * 【田川市専用】このファイルは「みらい議会＠田川市」フォーク専用のデータソースです。
 * 他自治体版フォークでは使用しないでください。
 *
 * データ本体は `data/sessions.json`（コミット済み）。
 * `pnpm --filter @mirai-gikai/seed tagawa:scrape`（scrape.ts）が
 * 田川市公式サイト「議会からのお知らせ」の「〜の提出議案と議決結果」ページ
 * （https://www.joho.tagawa.fukuoka.jp/list00711.html 配下）から機械的に
 * 抽出・再生成する。表現の書き換え（AI生成の解説等）は一切行っておらず、
 * 公式サイト記載の事実のみを転記している。
 *
 * 収録範囲（公式サイトの掲載範囲に準拠）:
 * - 令和元年12月定例会（議決結果の記載なし → resultLabel は null）
 * - 令和3年3月定例会 〜 令和8年6月定例会
 * - 令和2年は公式サイトにページが存在しないため未収録
 * - 令和7年6月定例会は流会・全議案廃案のため議決結果ページが無く未収録
 *
 * CSVへの変換は `pnpm --filter @mirai-gikai/seed tagawa:build-csv`（build-csv.ts）。
 */

import { readFileSync } from "node:fs";
import path from "node:path";

export type Proposer = "mayor" | "member" | "committee";

export interface BillSource {
  /** 議案番号等の表示ラベル（例: "議案第39号"）。番号が無い案件は null */
  billNumberLabel: string | null;
  /** 件名（公式サイト記載のまま） */
  title: string;
  /** 提出者区分 */
  proposer: Proposer;
  /**
   * 議決結果（公式サイト記載のまま。例: "原案可決", "否決", "同意", "承認",
   * "認定", "不認定"）。どの出典からも判明しなかった場合は null
   */
  resultLabel: string | null;
  /**
   * 議決結果の出典。official: 市公式サイトの議決結果ページ,
   * minutes: 会議録検索システムの本会議録からの自動抽出
   */
  resultSource?: "official" | "minutes";
  /** 議決月日（YYYY-MM-DD）。議決日不明の場合は会期末日 */
  resolvedDate: string;
}

export interface SessionSource {
  /** slug生成用キー */
  key: string;
  /** 会期名称（公式サイト記載のまま） */
  name: string;
  startDate: string;
  endDate: string;
  /** 出典ページURL（田川市公式サイト） */
  sourceUrl: string;
  bills: BillSource[];
}

export function loadTagawaSessions(): SessionSource[] {
  const jsonPath = path.join(import.meta.dirname, "data/sessions.json");
  return JSON.parse(readFileSync(jsonPath, "utf-8")) as SessionSource[];
}
