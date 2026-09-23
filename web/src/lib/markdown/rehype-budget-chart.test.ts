import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeBudgetChart } from "./rehype-budget-chart";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeBudgetChart)
  .use(rehypeStringify);

describe("rehypeBudgetChart", () => {
  it("budget-chart のコードブロックを BudgetChart 要素に置き換える", async () => {
    const markdown = [
      "## 図",
      "",
      "```budget-chart",
      '{ "total": { "before": 100, "change": 5, "after": 105 } }',
      "```",
    ].join("\n");
    const html = (await processor.process(markdown)).toString();
    expect(html).toContain("<BudgetChart spec=");
    expect(html).toContain("&#x22;after&#x22;: 105");
    expect(html).not.toContain("<pre>");
  });

  it("JSON が読めないコードブロックと他の言語のブロックはそのまま残す", async () => {
    const markdown = [
      "```budget-chart",
      "{ broken",
      "```",
      "",
      "```json",
      "{}",
      "```",
    ].join("\n");
    const html = (await processor.process(markdown)).toString();
    expect(html).not.toContain("<BudgetChart");
    expect(html.match(/<pre>/g)).toHaveLength(2);
  });
});
