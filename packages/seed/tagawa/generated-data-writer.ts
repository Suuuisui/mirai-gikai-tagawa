/**
 * スクレイパーの結果を web 側の静的データ（TypeScript）として書き出す【田川市専用】
 *
 * 書き出した後に Biome で整形し、web の lint がそのまま通るようにする
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** リポジトリのルート（packages/seed/tagawa から3つ上） */
const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

export interface GeneratedDataOptions {
  /** リポジトリルートからの相対パス */
  relativePath: string;
  /** export する定数名 */
  exportName: string;
  /** 型名（@mirai-gikai/shared/council/types から import する） */
  typeName: string;
  /** ファイル冒頭の説明（生成コマンド・出典） */
  header: string[];
  data: unknown[];
}

export function writeGeneratedData(options: GeneratedDataOptions): string {
  const outPath = path.join(REPO_ROOT, options.relativePath);
  const headerLines = options.header.map((line) => ` * ${line}`).join("\n");
  const source = `/**
 * 【自動生成】手で編集しないでください。
${headerLines}
 */

import type { ${options.typeName} } from "@mirai-gikai/shared/council/types";

export const ${options.exportName}: readonly ${options.typeName}[] = ${JSON.stringify(
    options.data,
    null,
    2
  )};
`;
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, source, "utf-8");
  execFileSync("pnpm", ["exec", "biome", "format", "--write", outPath], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  return outPath;
}
