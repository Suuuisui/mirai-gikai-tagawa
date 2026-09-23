import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import type { GlossaryEntry } from "@/features/glossary/shared/data/glossary";
import { rehypeGlossaryTerms } from "./rehype-glossary-terms";
import { rehypeWrapSections } from "./rehype-wrap-sections";

const entries: GlossaryEntry[] = [
  { term: "補正予算", description: "年度途中の予算の変更。" },
  { term: "基金", aliases: ["積立て"], description: "貯金。" },
];

const processor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkRehype)
  .use(rehypeWrapSections)
  .use(rehypeGlossaryTerms, { entries })
  .use(rehypeStringify);

async function render(markdown: string) {
  return (await processor.process(markdown)).toString();
}

describe("rehypeGlossaryTerms", () => {
  it("用語の初出を GlossaryTerm 要素で包み、2回目以降は包まない", async () => {
    const html = await render(
      "## 解説\n\n補正予算を組む。補正予算は年度途中の変更。"
    );
    expect(html).toContain(
      '<GlossaryTerm term="補正予算" description="年度途中の予算の変更。">補正予算</GlossaryTerm>を組む。補正予算は'
    );
  });

  it("h2 で区切ったブロックや改行（<br>）をまたいでも、ページ内で1回だけ印を付ける", async () => {
    const html = await render(
      "## A\n\n基金を使う。\n基金に戻す。\n\n## B\n\n基金を積む。"
    );
    expect(html).toContain("<br>");
    expect(html.match(/<GlossaryTerm/g)).toHaveLength(1);
  });

  it("見出し・リンク・コードの中には印を付けず、強調の中には付ける", async () => {
    const html = await render(
      "## 補正予算とは\n\n[補正予算のページ](https://example.com) と `補正予算` と *補正予算* について"
    );
    expect(html).toContain("<h2>補正予算とは</h2>");
    expect(html).toContain(
      '<a href="https://example.com">補正予算のページ</a>'
    );
    expect(html).toContain("<code>補正予算</code>");
    expect(html).toContain("<em><GlossaryTerm");
  });

  it("別表記にも印を付け、熟語の一部（積立金の中の基金）には付けない", async () => {
    const html = await render("基金積立金の増額と、積立てについて");
    expect(html).toContain(
      '<GlossaryTerm term="基金" description="貯金。">積立て</GlossaryTerm>'
    );
    expect(html.match(/<GlossaryTerm/g)).toHaveLength(1);
  });
});
