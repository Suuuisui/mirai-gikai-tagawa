import type { PhrasingContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";

/** mdastのインライン要素からプレーンテキストを再帰的に取り出す */
function toPlainText(nodes: PhrasingContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "inlineCode") {
        return node.value;
      }
      if ("children" in node) {
        return toPlainText(node.children as PhrasingContent[]);
      }
      return "";
    })
    .join("");
}

/**
 * Markdown本文からh2見出しのテキストを出現順に抽出する純粋関数。
 *
 * rehype-heading-ids.ts が同じ順序でh2にid（bill-section-N）を付与するため、
 * 抽出結果のindexがそのままアンカーのindexに対応する。
 */
export function extractH2Headings(markdown: string): string[] {
  const tree = unified().use(remarkParse).parse(markdown);
  const headings: string[] = [];

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      const text = toPlainText(node.children).trim();
      if (text !== "") {
        headings.push(text);
      }
    }
  }

  return headings;
}
