import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripComments } from "@/test-utils/strip-comments";
import { BOT_PROTECTED_ROUTES } from "./protected-routes";

/**
 * BotID で守る API の一覧（クライアントが判定用のヘッダーを付ける相手）と、
 * 実際に `rejectBotRequest` で判定している `route.ts`（サーバー）が、ずれていないかを検査する。
 *
 * - 一覧に無いのにサーバーで判定している API → ヘッダーが付かず、全リクエストがボット扱いになる
 * - 一覧にあるのにサーバーで判定していない API → 守られないまま素通りになる
 */

const srcDir = path.resolve(__dirname, "../../..");
const apiDir = path.join(srcDir, "app/api");

/** app/api 配下の route.ts を再帰的に集める（route.integration.test.ts などは名前が違うので入らない） */
function collectRouteFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(full));
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files.sort();
}

/** ソースをコメントを除いて読む（コメントに書いた文字で検査が通らないように） */
function readCode(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8"));
}

/** route.ts の場所から URL のパスを求める（`[billId]` のような動的な部分は `*`） */
function toRoutePath(file: string): string {
  const dir = path.relative(srcDir, path.dirname(file)).split(path.sep);
  // dir = ["app", "api", "interview", "chat"] → "/api/interview/chat"
  return `/${dir
    .slice(1)
    .map((segment) => segment.replace(/^\[.+\]$/, "*"))
    .join("/")}`;
}

/** そのファイルが、指定したメソッドのハンドラーを定義しているか */
function definesHandler(source: string, method: string): boolean {
  return new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`).test(
    source
  );
}

/**
 * ハンドラーの中で最初に `await` している関数の名前。
 * 判定は認証や本文の読み取りより前（＝ハンドラーの最初の await）でなければならない
 */
function firstAwaitedCall(source: string, method: string): string | undefined {
  const start = source.search(
    new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`)
  );
  if (start === -1) return undefined;
  return /\bawait\s+([\w.]+)/.exec(source.slice(start))?.[1];
}

const routeFiles = collectRouteFiles(apiDir).map((file) => ({
  file,
  routePath: toRoutePath(file),
  source: readCode(file),
}));

describe("BotID で守る API の一覧", () => {
  it("app/api の route.ts を見つけられている（検査が空振りしていない）", () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(5);
  });

  it("重複がなく、パスは /api/ で始まる", () => {
    const keys = BOT_PROTECTED_ROUTES.map(
      ({ path: p, method }) => `${method} ${p}`
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const { path: p } of BOT_PROTECTED_ROUTES) {
      expect(p.startsWith("/api/")).toBe(true);
    }
  });

  for (const { path: routePath, method } of BOT_PROTECTED_ROUTES) {
    describe(`${method} ${routePath}`, () => {
      const route = routeFiles.find((r) => r.routePath === routePath);

      it("対応する route.ts があり、そのメソッドのハンドラーを定義している", () => {
        expect(route).toBeDefined();
        expect(definesHandler(route?.source ?? "", method)).toBe(true);
      });

      it("ハンドラーは rejectBotRequest を呼ぶ", () => {
        expect(route?.source).toMatch(/\brejectBotRequest\(/);
      });

      it("判定はハンドラーの最初の await で、認証・本文の読み取り・AI の呼び出しより前", () => {
        expect(firstAwaitedCall(route?.source ?? "", method)).toBe(
          "rejectBotRequest"
        );
      });
    });
  }

  it("rejectBotRequest を呼んでいる route.ts は、すべて一覧にある", () => {
    const listed = new Set<string>(
      BOT_PROTECTED_ROUTES.map(({ path: p }) => p)
    );
    const guarded = routeFiles
      .filter(({ source }) => /\brejectBotRequest\(/.test(source))
      .map(({ routePath }) => routePath);

    expect(guarded.length).toBeGreaterThan(0);
    for (const routePath of guarded) {
      expect(listed.has(routePath)).toBe(true);
    }
  });
});

describe("クライアント側の初期化", () => {
  const source = readCode(path.join(srcDir, "instrumentation-client.ts"));

  it("initBotId を、守る API の一覧（BOT_PROTECTED_ROUTES）で呼んでいる", () => {
    expect(source).toMatch(
      /\binitBotId\(\{\s*protect:\s*\[\.\.\.BOT_PROTECTED_ROUTES\]/
    );
  });
});
