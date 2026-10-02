import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** app/ 配下の page.tsx と layout.tsx を再帰的に集める */
function collectMetadataSources(appDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "page.tsx" || entry.name === "layout.tsx") {
        files.push(full);
      }
    }
  }

  walk(appDir);
  return files.sort();
}

/**
 * Next.js のメタデータはトップレベルのキーごとに上書きされるため、
 * ページが openGraph を書くとルートレイアウトの共有画像（og:image）が消える。
 * openGraph を自前で書くページが、共有画像を入れ直していること
 * （buildPageShareMetadata を使うか images を指定する）をソースの文字列で検査する。
 * opengraph-image.tsx（ファイル規約）で画像を出すページを作ったら、ここで除外する
 */
describe("ページの共有メタデータ", () => {
  const appDir = path.resolve(__dirname, "../../app");
  const declaring = collectMetadataSources(appDir)
    .map((file) => ({
      name: path.relative(appDir, file).split(path.sep).join("/"),
      source: fs.readFileSync(file, "utf8"),
    }))
    .filter(({ source }) => /\bopenGraph\s*:/.test(source));

  it("検査対象のページが見つかる", () => {
    expect(declaring.length).toBeGreaterThan(0);
  });

  for (const { name, source } of declaring) {
    it(`${name} は openGraph に共有画像を含める`, () => {
      expect(/buildPageShareMetadata\(|\bimages\s*:/.test(source)).toBe(true);
    });
  }
});
