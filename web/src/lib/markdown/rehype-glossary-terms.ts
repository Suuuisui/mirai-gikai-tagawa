import type { Element, ElementContent, Root, Text } from "hast";
import type { GlossaryEntry } from "@/features/glossary/shared/data/glossary";
import { findGlossaryMark } from "@/features/glossary/shared/utils/find-glossary-mark";
import { BUDGET_CHART_TAG } from "./rehype-budget-chart";

/** 本文中の用語に印を付けるカスタム要素名（parseMarkdown の components で GlossaryTerm に対応付ける） */
export const GLOSSARY_TERM_TAG = "GlossaryTerm";

/** この中の文章には印を付けない（リンク・コード・見出し・図・すでに印を付けた語） */
const SKIP_TAGS = new Set([
  "a",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "iframe",
  "summary",
  GLOSSARY_TERM_TAG,
  BUDGET_CHART_TAG,
  "LongPressSection",
]);

function markTextNode(
  node: Text,
  entries: readonly GlossaryEntry[],
  seen: Set<string>
): ElementContent[] {
  const parts: ElementContent[] = [];
  let rest = node.value;
  for (;;) {
    const mark = findGlossaryMark(rest, entries, seen);
    if (!mark) break;
    seen.add(mark.entry.term);
    if (mark.start > 0)
      parts.push({ type: "text", value: rest.slice(0, mark.start) });
    parts.push({
      type: "element",
      tagName: GLOSSARY_TERM_TAG,
      properties: {
        term: mark.entry.term,
        description: mark.entry.description,
      },
      children: [{ type: "text", value: rest.slice(mark.start, mark.end) }],
    });
    rest = rest.slice(mark.end);
  }
  if (parts.length === 0) return [node];
  if (rest.length > 0) parts.push({ type: "text", value: rest });
  return parts;
}

function walk(
  element: Element,
  entries: readonly GlossaryEntry[],
  seen: Set<string>
) {
  if (SKIP_TAGS.has(element.tagName)) return;
  element.children = element.children.flatMap((child): ElementContent[] => {
    if (child.type === "text") return markTextNode(child, entries, seen);
    if (child.type === "element") walk(child, entries, seen);
    return [child];
  });
}

/**
 * 本文に出てくる用語（GLOSSARY）に印を付ける rehype プラグイン。
 * 各用語のページ内での初出だけを GlossaryTerm 要素で包む。
 * 印はボタンになり本文の長押し選択（AIに質問）を妨げるため、数を絞る。
 * 2回目以降の説明はページ下部の一覧（GlossarySection）で読める。
 * rehype-sanitize の後ろに置くこと（カスタム要素が除去されないよう）
 */
export function rehypeGlossaryTerms(options: {
  entries: readonly GlossaryEntry[];
}) {
  return (tree: Root) => {
    const seen = new Set<string>();
    for (const block of tree.children) {
      if (block.type !== "element") continue;
      walk(block, options.entries, seen);
    }
  };
}
