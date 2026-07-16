/**
 * 田川市議会「提出議案と議決結果」ページから議案説明資料PDFリンクを収集する
 * スクレイパー【田川市専用】
 *
 * `packages/seed/tagawa/data/sessions.json` の各会期の `sourceUrl`（既に
 * `scrape.ts` が収集済みの「提出議案と議決結果」ページURL）を再取得し、
 * ページ内の `<a href="....pdf">ラベル</a>` を抽出して議案番号
 * （billNumberLabel）に突合、`bills[].explanationMaterialUrls` として
 * sessions.json に書き戻す。
 *
 * 新たなページ探索は行わない（design: docs/20260715_1900_議員提出資料PDF活用の仕組み設計.md）。
 * パース・突合ロジックは `explanation-material-parser.ts` の純粋関数に切り出し済み。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-explanation-materials
 *
 * - アクセス間隔は1.5秒空ける（`scrape.ts` と共通の `http-utils.ts` を流用）
 * - 取得HTMLは `scrape.ts` と同じキャッシュ（`packages/seed/tagawa/.cache`）を
 *   共有する。同一 sourceUrl を持つ会期（例: 臨時会が定例会と同じページを
 *   参照するケース）はページを1回だけ取得し、該当する全会期の議案に対して
 *   突合する
 * - 突合できなかったリンクは警告として標準出力に出力する
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fetchWithCache } from "./http-utils";
import { loadTagawaSessions, type SessionSource } from "./source-data";
import {
  matchExplanationMaterials,
  parseExplanationLinkText,
  type ExplanationLink,
  type MatchTargetBill,
  type UnmatchedExplanationLink,
} from "./explanation-material-parser";

const SESSIONS_PATH = path.join(import.meta.dirname, "data/sessions.json");

/** ページのkiji IDをsourceUrlから取り出す（例: kiji0037791） */
function kijiIdFromUrl(url: string): string {
  const m = /(kiji\d+)/.exec(url);
  if (!m) throw new Error(`sourceUrlの形式が不正です: ${url}`);
  return m[1];
}

const PDF_LINK_RE = /<a\b[^>]*\shref="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi;
const ENTITY_RE = /&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g;
const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * PDFリンクの<a>内テキストからタグ・実体参照・ファイルサイズ表記を除いて
 * 表示用ラベルにする（例: "59号 説明資料 （PDF：261キロバイト）" → "59号 説明資料"）
 */
function cleanLinkLabel(inner: string): string {
  return inner
    .replace(/<[^>]*>/g, " ")
    .replace(ENTITY_RE, (m) => ENTITY_MAP[m] ?? " ")
    .replace(/[（(]\s*(?:PDF\s*[：:]\s*)?[\d.,]+\s*(?:キロバイト|メガバイト)\s*[）)]/g, " ")
    .replace(/^[\s・]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** HTMLから議案説明資料PDFへのリンク（ラベル・URL）を抽出する */
function extractPdfLinks(html: string): ExplanationLink[] {
  const links: ExplanationLink[] = [];
  for (const m of html.matchAll(PDF_LINK_RE)) {
    const [, url, inner] = m;
    const label = cleanLinkLabel(inner);
    if (!label) continue;
    links.push({ label, url });
  }
  return links;
}

interface SessionReport {
  key: string;
  name: string;
  matchedBills: number;
  totalPdfLinks: number;
  unmatched: UnmatchedExplanationLink[];
}

async function main() {
  const sessions = loadTagawaSessions();

  // 同一sourceUrlを共有する会期をまとめる（例: 臨時会が定例会と同じページを参照）
  const sessionsByUrl = new Map<string, SessionSource[]>();
  for (const session of sessions) {
    const list = sessionsByUrl.get(session.sourceUrl) ?? [];
    list.push(session);
    sessionsByUrl.set(session.sourceUrl, list);
  }

  const reports: SessionReport[] = [];

  for (const [sourceUrl, group] of sessionsByUrl) {
    const kijiId = kijiIdFromUrl(sourceUrl);
    const html = await fetchWithCache(sourceUrl, `${kijiId}.html`);
    const rawLinks = extractPdfLinks(html);
    const parsedLinks = rawLinks.map((link) => ({
      ...link,
      parsed: parseExplanationLinkText(link.label),
    }));

    // ページ内には複数会期分の議案が混在し得るため、グループ内の全会期の
    // 議案を束ねて突合する。billNumberLabel は会期内でも重複し得る
    // （市長提出と議員提出が別採番で同じ「議案第N号」になる会期がある）ため、
    // id には会期キー＋議案の添字を使う
    const billId = (sessionKey: string, index: number) =>
      `${sessionKey}#${index}`;
    const targetBills: MatchTargetBill[] = group.flatMap((s) =>
      s.bills.flatMap((b, i) =>
        b.billNumberLabel !== null
          ? [
              {
                id: billId(s.key, i),
                billNumberLabel: b.billNumberLabel,
                proposer: b.proposer,
              },
            ]
          : []
      )
    );

    const { matched, unmatched } = matchExplanationMaterials(
      parsedLinks,
      targetBills
    );

    for (const session of group) {
      let matchedBills = 0;
      session.bills.forEach((bill, i) => {
        // 再実行時に前回の紐付けが残らないよう一旦クリアする
        bill.explanationMaterialUrls = undefined;
        const urls = matched.get(billId(session.key, i));
        if (urls && urls.length > 0) {
          bill.explanationMaterialUrls = urls;
          matchedBills += 1;
        }
      });
      reports.push({
        key: session.key,
        name: session.name,
        matchedBills,
        totalPdfLinks: rawLinks.length,
        unmatched: group[0] === session ? unmatched : [],
      });
    }
  }

  writeFileSync(SESSIONS_PATH, `${JSON.stringify(sessions, null, 2)}\n`, "utf-8");

  console.log("\n=== 会期別 結果 ===");
  let totalMatchedBills = 0;
  let totalUnmatched = 0;
  for (const r of reports) {
    console.log(
      `${r.name} (${r.key}): 議案${r.matchedBills}件に説明資料PDFを紐付け（ページ内PDFリンク${r.totalPdfLinks}件）`
    );
    totalMatchedBills += r.matchedBills;
    if (r.unmatched.length > 0) {
      console.log(`  ⚠ 突合できなかったリンク: ${r.unmatched.length}件`);
      for (const u of r.unmatched) {
        console.log(`    - "${u.label}" (${u.url}) : ${u.reason}`);
      }
      totalUnmatched += r.unmatched.length;
    }
  }

  console.log(
    `\n🎉 完了: 議案${totalMatchedBills}件に説明資料PDFを紐付け / 突合できなかったリンク${totalUnmatched}件 → ${SESSIONS_PATH}`
  );
}

main();
