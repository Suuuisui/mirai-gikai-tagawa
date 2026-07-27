/**
 * ビジュアルスモークチェック
 *
 * 主要ページをスマホ幅(375px)とPC幅(1280px)で開き、以下を機械検査する:
 *   1. HTTPステータスが400未満であること
 *   2. 横スクロール（コンテンツのはみ出し）が発生していないこと
 *   3. ページ内JSエラー・コンソールエラーが出ていないこと
 *   4. 重なり検査: トップページのヒーロー見出しがチャットウィンドウと
 *      重なっていないこと（過去に実際に起きたレイアウト事故の回帰ガード）
 *
 * 「改修したら画面がぐちゃぐちゃになっていた」を防ぐための最低限の安全網。
 * 目視確認（.claude/skills/visual-check）の代わりではなく前段のふるい。
 *
 * 使い方:
 *   node scripts/visual-smoke.mjs                    # http://localhost:3000 を検査
 *   BASE_URL=https://tagawa-gikai.jp node scripts/visual-smoke.mjs   # 本番を検査
 *
 * スクリーンショットは smoke-artifacts/ に全ページ分保存される（CIではartifactsに
 * アップロードされるので、崩れの目視確認にも使える）
 */

import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR || "smoke-artifacts";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 900 },
];

/** 固定で検査するパス */
const STATIC_PATHS = [
  "/",
  "/sessions",
  "/members",
  "/archive",
  "/search",
  "/proposers/mayor",
  "/privacy",
  "/terms",
];

/** sitemapから1件ずつ拾う動的ルート（正規表現→代表1パス） */
const DYNAMIC_ROUTE_PATTERNS = [
  /^\/bills\/[^/]+$/,
  /^\/sessions\/[^/]+$/,
  /^\/members\/[^/]+$/,
  /^\/tags\/[^/]+$/,
  /^\/archive\/[^/]+\/bills$/,
];

/**
 * 外部要因のコンソールノイズは失敗扱いにしない。
 * エラーメッセージには発生元URLを付与してから照合する（素の
 * 「Failed to load resource: 404」だけではどのリソースか判別できないため）
 */
const IGNORED_CONSOLE_PATTERNS = [
  /google-analytics|googletagmanager|gtag/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
  // Vercel専用のスクリプト/API（CI・ローカルのnext startでは404になる）
  /\/_vercel\//i,
  /speed-insights|web-vitals/i,
  // 開発サーバーのHMR関連
  /\[HMR\]|\[Fast Refresh\]/i,
];

async function discoverDynamicPaths() {
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    if (!res.ok) return [];
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]).pathname;
      } catch {
        return null;
      }
    });
    const found = [];
    for (const pattern of DYNAMIC_ROUTE_PATTERNS) {
      const hit = urls.find((u) => u && pattern.test(decodeURI(u)));
      if (hit) {
        found.push(hit);
      } else {
        console.warn(`⚠️ sitemapに ${pattern} に合うURLが無くスキップ`);
      }
    }
    return found;
  } catch (error) {
    console.warn(`⚠️ sitemap取得に失敗（動的ルートはスキップ）: ${error}`);
    return [];
  }
}

/** ページ内で実行する検査（ブラウザコンテキスト内） */
function inPageChecks() {
  const failures = [];

  // 横スクロール検査（1pxはサブピクセル誤差として許容）
  const docWidth = document.documentElement.scrollWidth;
  if (docWidth > window.innerWidth + 1) {
    // はみ出している要素を特定してヒントとして添える
    const offenders = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 0 && r.width < docWidth) {
        offenders.push(
          `<${el.tagName.toLowerCase()} class="${(el.className?.toString?.() || "").slice(0, 60)}"> right=${Math.round(r.right)}`
        );
        if (offenders.length >= 3) break;
      }
    }
    failures.push(
      `横スクロール発生: scrollWidth=${docWidth} > viewport=${window.innerWidth}\n    ${offenders.join("\n    ")}`
    );
  }

  // トップページ: ヒーロー見出しとチャットウィンドウの重なり検査
  if (location.pathname === "/") {
    const h1 = document.querySelector("h1");
    const chat = [...document.querySelectorAll("div")].find((d) =>
      d.className.includes("pc:visible")
    );
    if (h1 && chat && getComputedStyle(chat).visibility === "visible") {
      const a = h1.getBoundingClientRect();
      const b = chat.getBoundingClientRect();
      const overlaps =
        a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
      if (overlaps) {
        failures.push(
          `ヒーロー見出しがチャットウィンドウと重なっている (h1.right=${Math.round(a.right)}, chat.left=${Math.round(b.left)})`
        );
      }
    }
  }

  return failures;
}

async function main() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const dynamicPaths = await discoverDynamicPaths();
  const paths = [...STATIC_PATHS, ...dynamicPaths];
  console.log(`検査対象: ${paths.length}ページ × ${VIEWPORTS.length}画面幅`);

  const browser = await chromium.launch();
  const allFailures = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });

    for (const path of paths) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const url = msg.location()?.url ?? "";
          consoleErrors.push(`${msg.text()}${url ? ` (${url})` : ""}`);
        }
      });
      page.on("pageerror", (error) => {
        consoleErrors.push(`pageerror: ${error.message}`);
      });
      // リソース読み込み失敗はレスポンスURL付きで記録する
      page.on("response", (res) => {
        if (res.status() >= 400) {
          consoleErrors.push(`resource ${res.status()}: ${res.url()}`);
        }
      });

      const label = `${viewport.name} ${path}`;
      const failures = [];
      try {
        const res = await page.goto(`${BASE_URL}${path}`, {
          waitUntil: "load",
          timeout: 45_000,
        });
        if (!res || res.status() >= 400) {
          failures.push(`HTTP ${res ? res.status() : "no response"}`);
        }
        // レイアウト確定を待つ（画像・フォント読み込み後の再レイアウト対策）
        await page.waitForTimeout(1200);

        failures.push(...(await page.evaluate(inPageChecks)));

        const realErrors = consoleErrors.filter(
          (e) => !IGNORED_CONSOLE_PATTERNS.some((p) => p.test(e))
        );
        if (realErrors.length > 0) {
          failures.push(`コンソールエラー: ${realErrors.slice(0, 3).join(" / ")}`);
        }

        const fileSafe = path.replaceAll("/", "_") || "_root";
        await page.screenshot({
          path: `${ARTIFACT_DIR}/${viewport.name}${fileSafe}.png`,
          fullPage: true,
        });
      } catch (error) {
        failures.push(`検査自体が失敗: ${error.message}`);
      } finally {
        await page.close();
      }

      if (failures.length > 0) {
        console.error(`✗ ${label}`);
        for (const f of failures) console.error(`  - ${f}`);
        allFailures.push({ label, failures });
      } else {
        console.log(`✓ ${label}`);
      }
    }

    await context.close();
  }

  await browser.close();

  if (allFailures.length > 0) {
    console.error(
      `\n✗ ${allFailures.length}件のページ×画面幅で問題が見つかりました（スクリーンショット: ${ARTIFACT_DIR}/）`
    );
    process.exit(1);
  }
  console.log(`\n✓ 全ページ通過（スクリーンショット: ${ARTIFACT_DIR}/）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
