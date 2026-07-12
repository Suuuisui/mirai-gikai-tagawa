/**
 * 田川市議会「提出議案と議決結果」スクレイパー【田川市専用】
 *
 * 田川市公式サイト（www.joho.tagawa.fukuoka.jp）の
 * 「議会からのお知らせ」一覧から「〜の提出議案と議決結果」ページを列挙し、
 * 各ページの表（番号・案件名・議決結果）と見出し（会期・議決日・提出者区分）を
 * 機械的にパースして `packages/seed/tagawa/data/sessions.json` に書き出す。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape
 *
 * - アクセス間隔は1.5秒空ける（公共サイトへの負荷配慮）
 * - 取得HTMLは TAGAWA_CACHE_DIR（未指定時は packages/seed/tagawa/.cache）に
 *   キャッシュし、再実行時はキャッシュを優先する
 * - 収録されるのは公式サイトに議決結果ページがある会期のみ
 *   （執筆時点: 令和元年12月定例会、令和3年3月〜令和8年6月。令和2年は
 *   ページ自体が存在しない。令和7年6月定例会は流会・廃案のため議決結果なし）
 * - 令和元年12月のページには議決結果の記載が無いため、会議録検索システム
 *   （www.kensakusystem.jp/tagawa, Shift_JIS）の本会議録から議決結果を
 *   自動抽出して補完する（resultSource: "minutes"）。抽出できなかった議案は
 *   resultLabel が null のまま残る
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { BillSource, Proposer, SessionSource } from "./source-data";

const LIST_URL = "https://www.joho.tagawa.fukuoka.jp/list00711.html";
const CACHE_DIR =
  process.env.TAGAWA_CACHE_DIR ?? path.join(import.meta.dirname, ".cache");
const OUT_PATH = path.join(import.meta.dirname, "data/sessions.json");
const FETCH_INTERVAL_MS = 1500;

// ---------------------------------------------------------------- fetch/cache

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastFetchAt = 0;

async function fetchWithCache(url: string, cacheName: string): Promise<string> {
  const cachePath = path.join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }
  const wait = lastFetchAt + FETCH_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastFetchAt = Date.now();
  console.log(`fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const body = await res.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, body, "utf-8");
  return body;
}

// ---------------------------------------------------------------- html utils

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&[a-z]+;|&#\d+;/g, (m) => ENTITIES[m] ?? " ");
}

/** 全角数字を半角へ */
function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/**
 * タグを除去したテキストと、テキスト各文字の元HTMLオフセット対応表を作る。
 * script/style/コメントは読み飛ばす。
 */
function stripTagsWithMap(html: string): { text: string; offsets: number[] } {
  let text = "";
  const offsets: number[] = [];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const scriptMatch = /^<(script|style)\b/i.exec(html.slice(i, i + 8));
    if (scriptMatch) {
      const close = new RegExp(`</${scriptMatch[1]}>`, "i");
      const rest = html.slice(i);
      const m = close.exec(rest);
      i = m ? i + m.index + m[0].length : html.length;
      continue;
    }
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      i = end === -1 ? html.length : end + 1;
      // タグ境界で単語が繋がらないよう空白を1つ入れる
      text += " ";
      offsets.push(i);
      continue;
    }
    if (html[i] === "&") {
      const m = /^(&[a-z]+;|&#\d+;)/.exec(html.slice(i, i + 8));
      if (m) {
        const decoded = ENTITIES[m[1]] ?? " ";
        for (const c of decoded) {
          text += c;
          offsets.push(i);
        }
        i += m[1].length;
        continue;
      }
    }
    text += html[i];
    offsets.push(i);
    i += 1;
  }
  return { text, offsets };
}

interface LeafTable {
  start: number;
  /** <caption> のテキスト（「市長提出議案」等の見出しが入ることがある） */
  caption: string;
  rows: string[][];
}

/** 入れ子を含まない最内側の <table> を行列テキストとして抽出する */
function extractLeafTables(html: string): LeafTable[] {
  const boundaries: Array<{ pos: number; open: boolean; end: number }> = [];
  const re = /<table\b[^>]*>|<\/table>/gi;
  let m = re.exec(html);
  while (m) {
    boundaries.push({
      pos: m.index,
      open: !m[0].startsWith("</"),
      end: m.index + m[0].length,
    });
    m = re.exec(html);
  }
  const tables: LeafTable[] = [];
  const stack: Array<{ start: number; contentStart: number; hasChild: boolean }> =
    [];
  for (const b of boundaries) {
    if (b.open) {
      if (stack.length > 0) stack[stack.length - 1].hasChild = true;
      stack.push({ start: b.pos, contentStart: b.end, hasChild: false });
    } else {
      const t = stack.pop();
      if (!t) continue;
      if (!t.hasChild) {
        const inner = html.slice(t.contentStart, b.pos);
        const captionMatch = /<caption[^>]*>([\s\S]*?)<\/caption>/i.exec(inner);
        const caption = captionMatch
          ? decodeEntities(captionMatch[1].replace(/<[^>]*>/g, " "))
              .replace(/\s+/g, " ")
              .trim()
          : "";
        const rows: string[][] = [];
        for (const rowMatch of inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
          const cells: string[] = [];
          for (const cellMatch of rowMatch[1].matchAll(
            /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
          )) {
            // <br> と <p> 境界は改行として保持する
            // （1セルに複数議案が入るページがあるため）
            const cellText = decodeEntities(
              cellMatch[1]
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/?p[^>]*>/gi, "\n")
                .replace(/<[^>]*>/g, " ")
            )
              .split("\n")
              .map((line) => line.replace(/\s+/g, " ").trim())
              .filter((line) => line !== "")
              .join("\n");
            cells.push(cellText);
          }
          if (cells.length > 0) rows.push(cells);
        }
        if (rows.length > 0) tables.push({ start: t.start, caption, rows });
      }
    }
  }
  tables.sort((a, b) => a.start - b.start);
  return tables;
}

// ---------------------------------------------------------------- parsing

interface SessionDef {
  era: number; // 令和N年（元年は1）
  kai: number | null; // 第N回
  month: number;
  type: "定例会" | "臨時会";
  startDate: string;
  endDate: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function eraToYear(era: number): number {
  return 2018 + era; // 令和元年 = 2019
}

/** 「2月19日から3月18日まで」「12月2日～12月19日」「5月29日」を日付範囲へ */
function parseKaiki(
  kaiki: string,
  year: number
): { startDate: string; endDate: string } | null {
  const s = normalizeDigits(kaiki).replace(/\s/g, "");
  const range =
    /(\d+)月(\d+)日(?:から|～|〜|~)(?:(\d+)月)?(\d+)日/.exec(s) ?? null;
  if (range) {
    const m1 = Number(range[1]);
    const d1 = Number(range[2]);
    const m2 = range[3] ? Number(range[3]) : m1;
    const d2 = Number(range[4]);
    return {
      startDate: `${year}-${pad2(m1)}-${pad2(d1)}`,
      endDate: `${year}-${pad2(m2)}-${pad2(d2)}`,
    };
  }
  const single = /(\d+)月(\d+)日/.exec(s);
  if (single) {
    const date = `${year}-${pad2(Number(single[1]))}-${pad2(Number(single[2]))}`;
    return { startDate: date, endDate: date };
  }
  return null;
}

/** ページ本文から会期定義（1ページに1〜2件）を抽出する */
function extractSessionDefs(text: string): SessionDef[] {
  const defs: SessionDef[] = [];
  const re =
    /令和\s*(元|\d+|[０-９]+)\s*年\s*(?:[（(]\s*第\s*(\d+|[０-９]+)\s*回\s*[）)])?\s*(\d+|[０-９]+)\s*月\s*(定例会|臨時会)\s*[（(]\s*会期\s*[：:]\s*([^（）()]+?)\s*[）)]/g;
  for (const m of text.matchAll(re)) {
    const era = m[1] === "元" ? 1 : Number(normalizeDigits(m[1]));
    const kai = m[2] ? Number(normalizeDigits(m[2])) : null;
    const month = Number(normalizeDigits(m[3]));
    const type = m[4] as "定例会" | "臨時会";
    const dates = parseKaiki(m[5], eraToYear(era));
    if (!dates) continue;
    if (defs.some((d) => d.month === month && d.type === type)) continue;
    defs.push({ era, kai, month, type, ...dates });
  }
  return defs;
}

function sessionName(def: SessionDef): string {
  const eraLabel = def.era === 1 ? "元" : String(def.era);
  const kaiPart = def.kai !== null ? `（第${def.kai}回）` : "";
  return `令和${eraLabel}年${kaiPart}${def.month}月${def.type}`;
}

function sessionKey(def: SessionDef): string {
  const typePart = def.type === "定例会" ? "teirei" : "rinji";
  const kaiPart = def.kai !== null ? String(def.kai) : `m${def.month}`;
  return `r${def.era}-${kaiPart}-${typePart}`;
}

interface Marker {
  offset: number;
  kind: "date" | "proposer" | "session";
  value: string;
}

const BILL_NUMBER_RE =
  /(?:議員提出議案|委員会提出議案|議案|報告|認定|諮問|同意|発議|陳情|請願)\s*第\s*\d+\s*号/;

function isDataTable(rows: string[][]): boolean {
  const header = rows[0].join(" ");
  if (header.includes("番号") && header.includes("案件名")) return true;
  return rows.some((r) =>
    BILL_NUMBER_RE.test(normalizeDigits(r[0] ?? "").replace(/[\s]+/g, ""))
  );
}

/** 議員提出議案テーブル（令和元年形式）: [番号, 「N号 件名 （PDF…）」] の2列 */
function titleFromPdfLabel(cell: string): string {
  return cell
    .replace(/（\s*PDF\s*[：:][^）]*）/g, "")
    .replace(/^\s*\d+号\s*/, "")
    .trim();
}

interface ParsedPage {
  sessions: SessionSource[];
}

function parsePage(html: string, sourceUrl: string): ParsedPage {
  const { text, offsets } = stripTagsWithMap(html);
  const defs = extractSessionDefs(text);
  if (defs.length === 0) {
    throw new Error(`会期情報が見つかりません: ${sourceUrl}`);
  }
  const year = eraToYear(defs[0].era);

  // 本文マーカー（議決日・提出者区分・会期切替）を出現位置つきで収集
  const markers: Marker[] = [];
  const dateRe =
    /(?:(\d+|[０-９]+)\s*月\s*(定例会|臨時会)\s*[：:]\s*)?(\d+|[０-９]+)\s*月\s*(\d+|[０-９]+)\s*日\s*議決分/g;
  for (const m of text.matchAll(dateRe)) {
    const offset = offsets[m.index];
    if (m[1] && m[2]) {
      markers.push({
        offset,
        kind: "session",
        value: `${Number(normalizeDigits(m[1]))}-${m[2]}`,
      });
    }
    const month = Number(normalizeDigits(m[3]));
    const day = Number(normalizeDigits(m[4]));
    markers.push({
      offset,
      kind: "date",
      value: `${year}-${pad2(month)}-${pad2(day)}`,
    });
  }
  const propRe = /(市長|議員|委員会)提出議案/g;
  for (const m of text.matchAll(propRe)) {
    markers.push({ offset: offsets[m.index], kind: "proposer", value: m[1] });
  }
  markers.sort((a, b) => a.offset - b.offset);

  const tables = extractLeafTables(html).filter((t) => isDataTable(t.rows));

  const sessions = new Map<string, SessionSource>();
  for (const def of defs) {
    const key = sessionKey(def);
    sessions.set(`${def.month}-${def.type}`, {
      key,
      name: sessionName(def),
      startDate: def.startDate,
      endDate: def.endDate,
      sourceUrl,
      bills: [],
    });
  }

  const firstDef = defs[0];
  let currentSession = sessions.get(`${firstDef.month}-${firstDef.type}`);
  let currentDate: string | null =
    firstDef.startDate === firstDef.endDate ? firstDef.startDate : null;
  let currentProposer: Proposer = "mayor";
  const proposerMap: Record<string, Proposer> = {
    市長: "mayor",
    議員: "member",
    委員会: "committee",
  };

  let mi = 0;
  for (const table of tables) {
    // このテーブルより前のマーカーをすべて反映
    while (mi < markers.length && markers[mi].offset < table.start) {
      const mk = markers[mi];
      if (mk.kind === "session") {
        const s = sessions.get(mk.value);
        if (s) {
          currentSession = s;
          currentProposer = "mayor";
        }
      } else if (mk.kind === "date") {
        currentDate = mk.value;
        currentProposer = "mayor";
      } else {
        currentProposer = proposerMap[mk.value] ?? "mayor";
      }
      mi += 1;
    }
    if (!currentSession) throw new Error(`会期不明のテーブル: ${sourceUrl}`);

    // <caption> に「市長提出議案」等の見出しが入っているページではそちらを優先
    const capProposer = /(市長|議員|委員会)提出議案/.exec(table.caption);
    const tableProposer = capProposer
      ? proposerMap[capProposer[1]]
      : currentProposer;

    const hasHeader = table.rows[0].join(" ").includes("番号");
    const header = hasHeader ? table.rows[0] : null;
    const resultCol = header
      ? header.findIndex((h) => h.includes("議決結果"))
      : -1;
    const nameCol = header ? header.findIndex((h) => h.includes("案件名")) : 1;
    const dataRows = hasHeader ? table.rows.slice(1) : table.rows;

    for (const row of dataRows) {
      if (row.length < 2) continue;
      // 番号セル内の議案番号をすべて拾う（1行に複数議案が入るページがある）
      const labels = [
        ...normalizeDigits(row[0]).matchAll(
          /(?:議員提出議案|委員会提出議案|議案|報告|認定|諮問|同意|発議|陳情|請願)\s*第\s*\d+\s*号/g
        ),
      ].map((m) => m[0].replace(/\s+/g, ""));
      const isNoNumber = /^[-－−\s]*$/.test(row[0]);
      if (labels.length === 0 && !isNoNumber) continue;

      // 件名・議決結果セルは行分割し、PDF資料への言及行を除外する
      const isPdfLine = (line: string) =>
        /ＰＤＦ|PDF|キロバイト|メガバイト|を参照/.test(line);
      const rawTitle =
        row.length === 2
          ? titleFromPdfLabel(row[1]) // 令和元年の議員提出議案形式
          : (row[nameCol >= 0 ? nameCol : 1] ?? "");
      const titleLines = rawTitle.split("\n").filter((l) => !isPdfLine(l));
      let resultLines: string[] = [];
      if (row.length > 2) {
        const rawResult =
          resultCol >= 0
            ? (row[resultCol] ?? "")
            : !header && row.length >= 4
              ? (row[3] ?? "")
              : "";
        // 議決結果セルには「修正案（PDF）」等の資料リンクが混ざることがある
        // ため、議決結果の語を含む行のみ採用する
        const resultKeyword =
          /可決|否決|同意|不同意|承認|認定|採択|継続|審議|審査|懲罰|議決|決定/;
        resultLines = rawResult
          .split("\n")
          .filter(
            (l) =>
              l.trim() !== "" &&
              !isPdfLine(l) &&
              resultKeyword.test(l.replace(/\s+/g, ""))
          );
      }
      const cleanResult = (s: string | undefined): string | null => {
        if (!s) return null;
        // 再議の結果表記「議案第33号 原案可決」等から結果部分のみ取り出す
        const cleaned = normalizeDigits(s)
          .replace(/\s+/g, "")
          .replace(/^(?:議案|報告|認定|諮問)第\d+号/, "");
        return cleaned === "" ? null : cleaned;
      };

      const entries: Array<{ label: string | null; title: string; result: string | null }> =
        [];
      if (labels.length > 1) {
        for (let i = 0; i < labels.length; i++) {
          entries.push({
            label: labels[i],
            title: titleLines[i] ?? titleLines.join(""),
            result: cleanResult(resultLines[i] ?? resultLines[0]),
          });
        }
      } else {
        entries.push({
          label: labels[0] ?? null,
          title: titleLines.join(""),
          result: cleanResult(resultLines.join("")),
        });
      }

      for (const entry of entries) {
        if (!entry.title) continue;
        // ラベル自体に提出者区分が含まれる場合はそちらを優先
        let proposer = tableProposer;
        if (entry.label?.startsWith("議員提出議案")) proposer = "member";
        else if (entry.label?.startsWith("委員会提出議案"))
          proposer = "committee";

        currentSession.bills.push({
          billNumberLabel: entry.label,
          title: entry.title,
          proposer,
          resultLabel: entry.result,
          ...(entry.result !== null
            ? { resultSource: "official" as const }
            : {}),
          resolvedDate: currentDate ?? currentSession.endDate,
        });
      }
    }
  }

  return { sessions: [...sessions.values()] };
}

// ------------------------------------------------ 会議録からの議決結果補完

const KENSAKU_BASE = "https://www.kensakusystem.jp/tagawa";

/** Shift_JIS のレスポンスを取得してUTF-8文字列にする（キャッシュはUTF-8で保存） */
async function fetchSjisWithCache(
  url: string,
  cacheName: string,
  postBody?: string
): Promise<string> {
  const cachePath = path.join(CACHE_DIR, cacheName);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }
  const wait = lastFetchAt + FETCH_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastFetchAt = Date.now();
  console.log(`fetching ${url}${postBody ? " (POST)" : ""}`);
  const res = await fetch(url, {
    method: postBody ? "POST" : "GET",
    headers: postBody
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : undefined,
    body: postBody,
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("shift_jis").decode(buf);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, text, "utf-8");
  return text;
}

/** 会議録検索システムのセッションコードをトップページから取得する */
async function fetchKensakuCode(): Promise<string> {
  // コードは失効しうるためキャッシュしない
  const res = await fetch(`${KENSAKU_BASE}/index.html`);
  if (!res.ok) throw new Error(`Failed to fetch kensaku top: ${res.status}`);
  const text = new TextDecoder("shift_jis").decode(await res.arrayBuffer());
  const m = /Code=([a-z0-9]+)/.exec(text);
  if (!m) throw new Error("会議録検索システムのセッションコードを取得できません");
  return m[1];
}

/** YYYY-MM-DD → 会議録ファイル名（例: 2019-12-19 → R011219A） */
function minutesFileName(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const era = y - 2018; // 令和
  return `R${pad2(era)}${pad2(m)}${pad2(d)}A`;
}

function* dateRange(start: string, end: string): Generator<string> {
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last) {
    yield cur.toISOString().slice(0, 10);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
}

/** 本会議録全文から「よって、議案第N号は…可決されました」等を抽出する */
function extractResultsFromMinutes(
  text: string
): Map<string, { resultLabel: string; kai: number | null }> {
  const results = new Map<string, { resultLabel: string; kai: number | null }>();
  const normalized = normalizeDigits(text);
  const kaiMatch = /令和\s*(?:元|\d+)\s*年第\s*(\d+)\s*回定例会/.exec(normalized);
  const kai = kaiMatch ? Number(kaiMatch[1]) : null;

  const sentenceRe =
    /よって、?\s*((?:議員提出議案|委員会提出議案|議案|報告|認定|諮問|同意|発議)第\s*\d+\s*号)([^。]*)/g;
  for (const m of normalized.matchAll(sentenceRe)) {
    const label = m[1].replace(/\s+/g, "");
    const rest = m[2];
    let resultLabel: string | null = null;
    if (/否決/.test(rest)) resultLabel = "否決";
    else if (/不認定/.test(rest)) resultLabel = "不認定";
    else if (/不同意/.test(rest)) resultLabel = "不同意";
    else if (/修正/.test(rest) && /可決/.test(rest)) resultLabel = "修正可決";
    else if (/原案のとおり可決|可決/.test(rest)) resultLabel = "原案可決";
    else if (/同意/.test(rest)) resultLabel = "同意";
    else if (/承認/.test(rest)) resultLabel = "承認";
    else if (/認定/.test(rest)) resultLabel = "認定";
    if (resultLabel && !results.has(label)) {
      results.set(label, { resultLabel, kai });
    }
  }
  return results;
}

/**
 * 議決結果が欠けている会期について、会議録検索システムの本会議録から
 * 議決結果を自動抽出して補完する
 */
async function supplementFromMinutes(session: SessionSource): Promise<void> {
  const missing = session.bills.filter((b) => b.resultLabel === null);
  if (missing.length === 0) return;
  console.log(
    `会議録から議決結果を補完します: ${session.name}（対象${missing.length}件）`
  );
  const code = await fetchKensakuCode();

  let sessionKai: number | null = null;
  for (const date of dateRange(session.startDate, session.endDate)) {
    const fileName = minutesFileName(date);
    // 発言一覧フレームを取得（存在しない日はdownloadPosが無い）
    const speakersUrl = `${KENSAKU_BASE}/cgi-bin3/r_Speakers.exe?${code}/${fileName}/0/0//10/1/31:0/403/1//0/0/0`;
    const speakersHtml = await fetchSjisWithCache(
      speakersUrl,
      `ks_speakers_${fileName}.html`
    );
    const positions = [
      ...speakersHtml.matchAll(/name="downloadPos" value="(\d+)"/g),
    ].map((m) => m[1]);
    if (positions.length === 0) continue;

    // 全発言を一括ダウンロード（GetPerson.exe はテキストを返す）
    const body = [
      `Code=${code}`,
      `fileName=${fileName}`,
      ...positions.map((p) => `downloadPos=${p}`),
    ].join("&");
    const minutes = await fetchSjisWithCache(
      `${KENSAKU_BASE}/cgi-bin3/GetPerson.exe`,
      `ks_minutes_${fileName}.txt`,
      body
    );

    const extracted = extractResultsFromMinutes(minutes);
    for (const [label, { resultLabel, kai }] of extracted) {
      if (kai !== null) sessionKai = kai;
      let bill = session.bills.find(
        (b) => b.resultLabel === null && b.billNumberLabel === label
      );
      if (!bill) {
        // 公式ページでは議員提出/委員会提出議案が「議案第N号」とだけ
        // 表記されることがあるため、提出者区分つきでフォールバック照合する
        const prefixMatch = /^(議員提出|委員会提出)(議案第\d+号)$/.exec(label);
        if (prefixMatch) {
          const proposer =
            prefixMatch[1] === "議員提出" ? "member" : "committee";
          bill = session.bills.find(
            (b) =>
              b.resultLabel === null &&
              b.proposer === proposer &&
              b.billNumberLabel === prefixMatch[2]
          );
        }
      }
      if (bill) {
        bill.resultLabel = resultLabel;
        bill.resultSource = "minutes";
        bill.resolvedDate = date;
      }
    }
  }

  // 会議録から回次（第N回）が判明した場合は会期名・キーを正式表記に更新する
  if (sessionKai !== null && !session.name.includes("回）")) {
    const m = /^令和(元|\d+)年(\d+)月(定例会|臨時会)$/.exec(session.name);
    if (m) {
      session.name = `令和${m[1]}年（第${sessionKai}回）${m[2]}月${m[3]}`;
      const eraNum = m[1] === "元" ? 1 : Number(m[1]);
      session.key = `r${eraNum}-${sessionKai}-${m[3] === "定例会" ? "teirei" : "rinji"}`;
    }
  }

  const still = session.bills.filter((b) => b.resultLabel === null).length;
  console.log(
    `  補完結果: ${missing.length - still}/${missing.length}件を抽出（残り${still}件は議決結果不明）`
  );
}

// ---------------------------------------------------------------- main

async function main() {
  const listHtml = await fetchWithCache(LIST_URL, "list00711.html");

  // 一覧から「提出議案と議決結果」ページを列挙（タイトルはリンク先で判定）
  const pageUrls = new Map<string, string>(); // kijiId -> url
  const linkRe =
    /<a[^>]+href="(https:\/\/www\.joho\.tagawa\.fukuoka\.jp\/(kiji\d+)\/index\.html)"[^>]*>([\s\S]*?)<\/a>/g;
  const titles = new Map<string, string>();
  for (const m of listHtml.matchAll(linkRe)) {
    const [, url, kijiId, inner] = m;
    const t = decodeEntities(inner.replace(/<[^>]*>/g, "")).trim();
    if (t && !titles.get(kijiId)) titles.set(kijiId, t);
    if (t.includes("議決結果") && t.includes("提出議案")) {
      pageUrls.set(kijiId, url);
    }
  }

  console.log(`対象ページ: ${pageUrls.size}件`);
  const allSessions: SessionSource[] = [];
  for (const [kijiId, url] of pageUrls) {
    const html = await fetchWithCache(url, `${kijiId}.html`);
    const { sessions } = parsePage(html, url);
    for (const s of sessions) {
      console.log(
        `  ${s.name} (${s.startDate}〜${s.endDate}): 議案${s.bills.length}件`
      );
      allSessions.push(s);
    }
  }

  // 議決結果が公式サイトに無い会期は本会議録から補完する
  // （TAGAWA_NO_MINUTES=1 でスキップ可能。公式ページのパース検証用）
  if (process.env.TAGAWA_NO_MINUTES !== "1") {
    for (const s of allSessions) {
      await supplementFromMinutes(s);
    }
  }

  allSessions.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const dupKeys = allSessions.map((s) => s.key);
  if (new Set(dupKeys).size !== dupKeys.length) {
    throw new Error(`会期キーが重複しています: ${dupKeys.join(", ")}`);
  }

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(allSessions, null, 2)}\n`, "utf-8");
  const totalBills = allSessions.reduce((n, s) => n + s.bills.length, 0);
  console.log(
    `\n🎉 完了: 会期${allSessions.length}件 / 議案${totalBills}件 → ${OUT_PATH}`
  );
}

main();
