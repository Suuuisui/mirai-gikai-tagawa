import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeHeadingIds } from "./rehype-heading-ids";

async function process(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHeadingIds)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

describe("rehypeHeadingIds", () => {
  it("h2に出現順のidを付与する", async () => {
    const html = await process("## 解説\n\n本文\n\n## 論点\n\n本文");
    expect(html).toContain('<h2 id="bill-section-0">解説</h2>');
    expect(html).toContain('<h2 id="bill-section-1">論点</h2>');
  });

  it("h2以外の見出しにはidを付与しない", async () => {
    const html = await process("# タイトル\n\n### 小見出し");
    expect(html).not.toContain("bill-section-");
  });
});
