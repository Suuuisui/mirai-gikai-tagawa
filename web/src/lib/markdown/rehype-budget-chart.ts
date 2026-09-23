import type { Element, ElementContent, Root } from "hast";
import { visit } from "unist-util-visit";
import { parseBudgetChartSpec } from "@/features/bills/shared/utils/budget-chart";

/** 図の定義を書くコードブロックの言語名（```budget-chart） */
export const BUDGET_CHART_LANGUAGE = "budget-chart";
/** 置き換え先のカスタム要素名（parseMarkdown の components で BudgetChart に対応付ける） */
export const BUDGET_CHART_TAG = "BudgetChart";

/** コードブロックの中身（remark-rehype が作る code 要素の子は text ノードだけ） */
function codeText(node: Element): string {
  return node.children
    .map((child: ElementContent) => (child.type === "text" ? child.value : ""))
    .join("");
}

function isBudgetChartCode(node: Element): boolean {
  const classes = node.properties?.className;
  return (
    Array.isArray(classes) &&
    classes.includes(`language-${BUDGET_CHART_LANGUAGE}`)
  );
}

/**
 * ```budget-chart のコードブロックを BudgetChart 要素に置き換える rehype プラグイン。
 * JSON が読めないときはコードブロックをそのまま残す（書き手が気づけるように）。
 * rehype-sanitize の後ろに置くこと
 */
export function rehypeBudgetChart() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || typeof index !== "number")
        return;
      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code"
      );
      if (!code || !isBudgetChartCode(code)) return;
      const json = codeText(code);
      if (parseBudgetChartSpec(json) === null) return;
      const chart: Element = {
        type: "element",
        tagName: BUDGET_CHART_TAG,
        properties: { spec: json },
        children: [],
      };
      parent.children[index] = chart;
    });
  };
}
