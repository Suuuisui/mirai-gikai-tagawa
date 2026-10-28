import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 管理画面の「入口」がすべて requireAdmin() / getCurrentAdmin()（＝管理者ロール＋
 * 二段階認証 AAL2 の確認）を通っていることの構造チェック。
 * 二段階認証をこの2関数で強制しているので、通らない入口が1つでもあれば抜け穴になる。
 */
const SRC = path.resolve(__dirname, "../../../..");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const rel = (f: string) => path.relative(SRC, f);
const read = (f: string) => fs.readFileSync(f, "utf8");
const GUARD = /\b(requireAdmin|getCurrentAdmin)\(/;

describe("管理者チェックの網羅", () => {
  it('"use server" ファイルの全 export 関数が管理者チェックを呼ぶ', () => {
    const bad: string[] = [];
    for (const f of files.filter((f) =>
      /^\s*["']use server["']/m.test(read(f))
    )) {
      const src = read(f);
      const starts = [
        ...src.matchAll(
          /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g
        ),
      ];
      if (starts.length === 0) bad.push(`${rel(f)} (export 関数なし)`);
      starts.forEach((m, i) => {
        const body = src.slice(m.index, starts[i + 1]?.index ?? src.length);
        if (!GUARD.test(body)) bad.push(`${rel(f)} :: ${m[1] ?? m[2]}`);
      });
    }
    expect(bad).toEqual([]);
  });

  // Bearer トークンなど別の仕組みで守っている機械向けの入口（middleware の外で独自認証）
  const MACHINE_ROUTES = new Set([
    "app/api/auth/callback/route.ts",
    "app/api/mcp/route.ts",
    "app/api/topic-analysis/phases/phase1/route.ts",
    "app/api/topic-analysis/phases/phase2/route.ts",
    "app/api/topic-analysis/phases/phase3/route.ts",
  ]);

  it("API ルートは管理者チェックを呼ぶか、機械向けの許可リストにある", () => {
    const bad = files
      .filter((f) => /app\/api\/.*route\.ts$/.test(f))
      .filter((f) => !MACHINE_ROUTES.has(rel(f)) && !GUARD.test(read(f)))
      .map(rel);
    expect(bad).toEqual([]);
  });

  it("保護されたレイアウトが getCurrentAdmin() を呼ぶ", () => {
    expect(read(path.join(SRC, "app/(protected)/layout.tsx"))).toMatch(
      /getCurrentAdmin\(/
    );
  });

  it("AAL を見ない getAdminMfaSession() は二段階認証のページ以外から呼ばない", () => {
    const allowed = (f: string) =>
      rel(f).startsWith("app/mfa/") ||
      rel(f) === "features/auth/server/lib/auth-server.ts" ||
      rel(f) === "features/auth/server/lib/admin-guard-coverage.test.ts";
    const bad = files
      .filter((f) => !allowed(f) && /getAdminMfaSession/.test(read(f)))
      .map(rel);
    expect(bad).toEqual([]);
  });
});
