/**
 * 田川市議会「請願・陳情 審査状況と審査結果」スクレイパー【田川市専用】
 *
 * 公式サイトの「請願・陳情」一覧（list00713）から「審査状況と審査結果」の
 * ページを列挙し、各ページの表を読み取って
 * web/src/features/petitions/shared/data/petitions-data.ts に書き出す。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:scrape-petitions
 *
 * - アクセス間隔は1.5秒（http-utils の共通スロットル）
 * - 取得HTMLは packages/seed/tagawa/.cache にキャッシュされる。公式ページが
 *   更新されたときは該当ページのキャッシュ（petitions-kiji….html）を消して再実行する
 */

import { collectLinkedPageUrls, extractPageId } from "./council-html-utils";
import { writeGeneratedData } from "./generated-data-writer";
import { fetchWithCache } from "./http-utils";
import { parsePetitionPage, sortPetitions } from "./petition-parser";

const LIST_URL = "https://www.joho.tagawa.fukuoka.jp/list00713.html";
const OUT_PATH = "web/src/features/petitions/shared/data/petitions-data.ts";

async function main() {
  const listHtml = await fetchWithCache(LIST_URL, "petitions-list.html");
  const pageUrls = collectLinkedPageUrls(listHtml, {
    baseUrl: LIST_URL,
    textIncludes: "審査状況と審査結果",
  });
  console.log(`請願・陳情ページ: ${pageUrls.length}件`);

  const records = [];
  for (const url of pageUrls) {
    const html = await fetchWithCache(url, `petitions-${extractPageId(url)}.html`);
    const parsed = parsePetitionPage(html, url);
    console.log(`  ${url}: ${parsed.length}件`);
    records.push(...parsed);
  }

  const sorted = sortPetitions(records);
  const outPath = writeGeneratedData({
    relativePath: OUT_PATH,
    exportName: "PETITIONS",
    typeName: "PetitionRecord",
    header: [
      "生成コマンド: pnpm --filter @mirai-gikai/seed tagawa:scrape-petitions",
      `出典: 田川市議会「請願・陳情」 ${LIST_URL}`,
      `${sorted.length}件（請願 ${sorted.filter((r) => r.kind === "seigan").length}・陳情 ${sorted.filter((r) => r.kind === "chinjo").length}）`,
    ],
    data: sorted,
  });
  console.log(`wrote ${outPath} (${sorted.length} records)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
