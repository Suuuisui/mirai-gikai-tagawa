import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import { stripComments } from "@/test-utils/strip-comments";

/**
 * sitemap に載せないルートと、その理由。
 * routes に新しいルートを足したら、sitemap.ts（または lib/seo/sitemap-entries.ts）に
 * 載せるか、ここに理由を付けて除外する。載せ忘れを検出するためのテスト
 */
const EXCLUDED_FROM_SITEMAP: Record<string, string> = {
  home: "先頭の項目で baseUrl そのものを載せている（routes.home() は使わない）",
  billOpinions:
    "AIインタビューの回答一覧。公開された回答が無い議案では中身が無く、noindex にしている",
  interviewDisclosure:
    "AIインタビューの情報開示（補足ページ）。案内ページ（interviewLP）から辿れれば足りる",
  interviewChat: "チャット画面で、noindex",
  previewBillDetail: "token付きの未公開プレビューで、noindex",
  previewInterviewLP: "token付きの未公開プレビューで、noindex",
  previewInterviewDisclosure: "token付きの未公開プレビューで、noindex",
  previewInterviewChat: "token付きの未公開プレビューで、noindex",
  publicReport:
    "利用者が書いたインタビューレポート。公開同意と件数の条件があり、載せる対象にしない",
  reportComplete: "インタビューを終えた本人への完了画面で、noindex",
  legacyReportChatLog: "旧URLの会話ログで、noindex",
  committeesByTopic:
    "テーマで絞り込んだ一覧。中身は /committees と同じで canonical も /committees",
};

/** ソースをコメントを除いて読む（コメントに書いた文字で検査が通らないように） */
function readCode(relativePath: string): string {
  return stripComments(
    fs.readFileSync(path.resolve(__dirname, relativePath), "utf8")
  );
}

/**
 * `const x = fn(` で戻り値を受け取り、その x を `...x` で別の配列に展開しているか。
 * 項目を組み立てる関数を作っただけで、sitemap.ts が呼んで返す配列に入れ忘れていないかの確認
 */
function spreadsResultOf(source: string, functionName: string): boolean {
  const variable = new RegExp(
    `const\\s+(\\w+)\\s*=\\s*${functionName}\\(`
  ).exec(source)?.[1];
  return (
    variable !== undefined && new RegExp(`\\.\\.\\.${variable}\\b`).test(source)
  );
}

describe("sitemap に載せるページ", () => {
  // 呼び出し側（sitemap.ts）と、項目を組み立てる側（sitemap-entries.ts）
  const sitemapSource = readCode("sitemap.ts");
  const entriesSource = readCode("../lib/seo/sitemap-entries.ts");
  const bothSources = [sitemapSource, entriesSource].join("\n");

  const routeKeys = Object.keys(routes);

  for (const key of routeKeys) {
    if (key in EXCLUDED_FROM_SITEMAP) continue;
    it(`routes.${key} は sitemap に載せている`, () => {
      expect(bothSources).toContain(`routes.${key}(`);
    });
  }

  for (const key of Object.keys(EXCLUDED_FROM_SITEMAP)) {
    it(`除外リストの ${key} は routes にあり、sitemap に載せていない`, () => {
      expect(routeKeys).toContain(key);
      expect(bothSources).not.toContain(`routes.${key}(`);
    });
  }

  // 上の検査は組み立て側（sitemap-entries.ts）にルートがあれば通るので、
  // sitemap.ts がその関数を呼び、戻り値を返す配列に入れていることを別に確かめる
  for (const functionName of [
    "buildTopicSitemapEntries",
    "buildInterviewSitemapEntries",
  ]) {
    it(`sitemap.ts は ${functionName} を呼び、戻り値を返す配列に展開している`, () => {
      expect(spreadsResultOf(sitemapSource, functionName)).toBe(true);
    });
  }
});
