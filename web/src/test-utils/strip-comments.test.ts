import { describe, expect, it } from "vitest";
import { stripComments } from "./strip-comments";

describe("stripComments", () => {
  it("行コメントを取り除く（コードの後ろに付いたものも）", () => {
    const source = ["// 先頭のコメント", "const a = 1; // 後ろのコメント"].join(
      "\n"
    );
    expect(stripComments(source)).toBe("\nconst a = 1; ");
  });

  it("ブロックコメントを、複数行にわたるものも含めて取り除く", () => {
    const source = "before /* 一行 */ after\n/**\n * 複数行\n */\nend";
    expect(stripComments(source)).toBe("before  after\n\nend");
  });

  it("JSX の中のコメントも取り除く", () => {
    expect(stripComments("<div>{/* 説明 */}text</div>")).toBe(
      "<div>{}text</div>"
    );
  });

  it("文字列リテラルの中の // や /* は残す（URL など）", () => {
    const source = [
      'const url = "https://example.com/a";',
      "const single = 'http://localhost:3000';",
      "const template = `prefix//path`;",
      'const block = "/* not a comment */";',
    ].join("\n");
    expect(stripComments(source)).toBe(source);
  });

  it("文字列リテラルの直後のコメントだけを取り除く", () => {
    expect(stripComments('const url = "https://example.com"; // 例')).toBe(
      'const url = "https://example.com"; '
    );
  });

  it("エスケープした引用符の後ろも、文字列として読む", () => {
    const source = 'const s = "a\\"//b"; // コメント';
    expect(stripComments(source)).toBe('const s = "a\\"//b"; ');
  });

  it("コメントの中の引用符で、文字列の判定が狂わない", () => {
    const source = ["// it's a comment", "const a = 1;"].join("\n");
    expect(stripComments(source)).toBe("\nconst a = 1;");
  });

  it("コメントに書かれた呼び出しは消え、コードの呼び出しは残る", () => {
    const source = [
      "// ...buildPageShareMetadata({ commented out })",
      "const metadata = { ...buildPageShareMetadata({ title }) };",
    ].join("\n");
    const code = stripComments(source);
    expect(code).not.toContain("commented out");
    expect(code).toContain("...buildPageShareMetadata({ title })");
  });
});
