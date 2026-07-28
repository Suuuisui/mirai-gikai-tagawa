import type { Root } from "hast";

/** 目次（BillToc）のアンカーと対応するh2見出しのid接頭辞 */
export const HEADING_ID_PREFIX = "bill-section-";

/**
 * ルート直下のh2要素に、出現順のid（bill-section-0, bill-section-1, …）を
 * 付与するrehypeプラグイン。
 *
 * extract-h2-headings.ts が同じ順序で見出しテキストを抽出するため、
 * 目次のリンク先アンカーとして機能する。
 * rehype-sanitize がidを除去・改変しないよう、sanitize後に適用すること。
 */
export function rehypeHeadingIds() {
  return (tree: Root) => {
    let index = 0;
    for (const child of tree.children) {
      if (child.type === "element" && child.tagName === "h2") {
        child.properties = {
          ...child.properties,
          id: `${HEADING_ID_PREFIX}${index}`,
        };
        index++;
      }
    }
  };
}
