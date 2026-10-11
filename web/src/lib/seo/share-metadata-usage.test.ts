import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripComments } from "@/test-utils/strip-comments";

const appDir = path.resolve(__dirname, "../../app");

/** app/ 配下から、指定した名前のファイル（page.tsx / layout.tsx）を再帰的に集める */
function collectFiles(dir: string, fileName: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, fileName));
    } else if (entry.name === fileName) {
      files.push(full);
    }
  }
  return files.sort();
}

/** ソースをコメントを除いて読む（コメントに書いた文字で検査が通らないように） */
function readCode(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8"));
}

function toSource(file: string) {
  return {
    name: path.relative(appDir, file).split(path.sep).join("/"),
    file,
    source: readCode(file),
  };
}

/**
 * 常に noindex のページ（静的な metadata で robots に index: false を指定している）か。
 * generateMetadata の中で条件つきに noindex にするページ（トピックが無い議案など）は、
 * noindex でないときの共有メタデータが要るので、ここには含めない
 */
function declaresNoindex(source: string): boolean {
  return (
    !source.includes("generateMetadata") && /\bindex\s*:\s*false\b/.test(source)
  );
}

/** page.tsx から app/ までの各階層にある layout.tsx のうち、noindex を指定しているものがあるか */
function inheritsNoindexFromLayout(pageFile: string): boolean {
  let dir = path.dirname(pageFile);
  while (dir.startsWith(appDir)) {
    const layout = path.join(dir, "layout.tsx");
    if (fs.existsSync(layout) && declaresNoindex(readCode(layout))) return true;
    if (dir === appDir) break;
    dir = path.dirname(dir);
  }
  return false;
}

/**
 * 常に noindex のページ。ここに無いページは検索結果に出す（共有メタデータが要る）扱いになる。
 * `index: false` の貼り間違い（検索結果から消えてしまう）や貼り忘れ（出してはいけないページが出る）に
 * 気づけるよう、名前で固定している。noindex のページを足した・外したときは、この一覧も直す
 */
const NOINDEX_PAGES = [
  "(main)/bills/[id]/interview/chat/page.tsx",
  "(main)/preview/bills/[id]/interview/chat/page.tsx",
  "(main)/preview/bills/[id]/interview/disclosure/page.tsx",
  "(main)/preview/bills/[id]/interview/page.tsx",
  "(main)/preview/bills/[id]/page.tsx",
  "(main)/report/[reportId]/chat-log/page.tsx",
  "(main)/report/[reportId]/complete/page.tsx",
  "dev/features/bills/bill-card/page.tsx",
  "dev/features/bills/bill-status-badge/page.tsx",
  "dev/features/interview/consent-modal/page.tsx",
  "dev/features/interview/public-consent-modal/page.tsx",
  "dev/features/interview/rating-widget/page.tsx",
  "dev/features/interview/summary-input/page.tsx",
  "dev/page.tsx",
  "dev/ui/page.tsx",
];

/** 検索結果に出すページの数の下限（2026-10 時点で 27）。ページを数え落としていないかの確認 */
const MIN_INDEXABLE_PAGES = 25;

/**
 * Next.js のメタデータはトップレベルのキーごとに上書きされるため、
 * ページが openGraph を自前で書くとルートレイアウトの共有画像（og:image）や
 * サイト名（og:site_name）、ページの URL（og:url）が抜けやすい。
 * 検索結果に出すページ（noindex でないページ）は、共有用のメタデータを必ず
 * buildPageShareMetadata で作る。新しいページを足したときの書き忘れを、ここで検出する。
 *
 * opengraph-image.tsx（ファイル規約）で画像を出すページを作ったら、ここで除外する
 */
describe("ページの共有メタデータ", () => {
  const pages = collectFiles(appDir, "page.tsx").map(toSource);
  // ルートレイアウトは、サイト全体の既定の共有メタデータ（openGraph）を定める側なので除く
  const rootLayoutFile = path.join(appDir, "layout.tsx");
  const nestedLayouts = collectFiles(appDir, "layout.tsx")
    .filter((file) => file !== rootLayoutFile)
    .map(toSource);

  const isNoindex = ({ file, source }: (typeof pages)[number]) =>
    declaresNoindex(source) || inheritsNoindexFromLayout(file);
  const indexable = pages.filter((page) => !isNoindex(page));
  const noindex = pages.filter(isNoindex);

  it("検索結果に出すページが、下限以上見つかる", () => {
    expect(indexable.length).toBeGreaterThanOrEqual(MIN_INDEXABLE_PAGES);
  });

  it("noindex のページは、固定した一覧のとおり", () => {
    expect(noindex.map(({ name }) => name).sort()).toEqual(
      [...NOINDEX_PAGES].sort()
    );
  });

  for (const { name, source } of indexable) {
    it(`${name} は buildPageShareMetadata を metadata に展開して、共有用のメタデータを作る`, () => {
      expect(source).toMatch(/\.\.\.\s*buildPageShareMetadata\(/);
    });
  }

  for (const { name, source } of [...pages, ...nestedLayouts]) {
    it(`${name} は openGraph を自前で書かない`, () => {
      expect(/\bopenGraph\s*:/.test(source)).toBe(false);
    });
  }
});
