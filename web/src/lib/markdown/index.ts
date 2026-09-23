import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ReactElement } from "react";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { LongPressSection } from "@/features/bills/client/components/bill-detail/long-press-section";
import { BudgetChart } from "@/features/bills/server/components/bill-detail/budget-chart";
import { GlossaryTerm } from "@/features/glossary/client/components/glossary-term";
import { GLOSSARY } from "@/features/glossary/shared/data/glossary";
import { BUDGET_CHART_TAG, rehypeBudgetChart } from "./rehype-budget-chart";
import { rehypeEmbedYouTube } from "./rehype-embed-youtube";
import { rehypeExternalLinks } from "./rehype-external-links";
import {
  GLOSSARY_TERM_TAG,
  rehypeGlossaryTerms,
} from "./rehype-glossary-terms";
import { rehypeHeadingIds } from "./rehype-heading-ids";
import { rehypeInjectElement } from "./rehype-inject-element";
import { rehypeWrapSections } from "./rehype-wrap-sections";

// rehypeSanitizeのスキーマをカスタマイズ
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // カスタム要素を許可
    "LongPressSection",
  ],
};

/**
 * MarkdownテキストをReact Elementに変換
 * @param markdown - Markdown形式のテキスト
 * @param options - オプション（currentLevel等）
 * @returns React Element（部分水和対応）
 */
export async function parseMarkdown(markdown: string): Promise<ReactElement> {
  // Markdown → mdast（remarkBreaksでソフト改行をbreak nodeに変換）
  const remarkProcessor = unified().use(remarkParse).use(remarkBreaks);
  const parsed = remarkProcessor.parse(markdown);
  const mdast = (await remarkProcessor.run(parsed)) as typeof parsed;

  // mdast → hast（rehypeプラグイン適用）
  const hast = await unified()
    .use(remarkRehype)
    .use(rehypeWrapSections)
    .use(rehypeInjectElement, {
      injections: [
        {
          targetH2Index: 3,
          tagName: "LongPressSection",
        },
        // 難易度切り替え（説明をもっと詳しく）のDifficultyInfoCard注入は、
        // 田川市版では hard 難易度の議案本文を用意していないため一時的に非表示にしている。
        // hard 版コンテンツを用意した際に、この injection と関連する import・
        // sanitizeSchema・components 登録を復活させること。
      ],
    })
    .use(rehypeSanitize, sanitizeSchema)
    // 目次（BillToc）用のアンカーid。sanitizeにidを除去されないよう後段に置く
    .use(rehypeHeadingIds)
    .use(rehypeExternalLinks)
    .use(rehypeEmbedYouTube)
    // 予算の図解（```budget-chart）と、むずかしいことばの印。
    // どちらもカスタム要素に置き換えるので sanitize の後段に置く。
    // 印は図の中に付けないよう、図の置き換えより後に実行する
    .use(rehypeBudgetChart)
    .use(rehypeGlossaryTerms, { entries: GLOSSARY })
    .run(mdast);

  // hast → React Element（部分水和）
  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: {
      LongPressSection, // 「わからない言葉は長押しでAIに質問」の案内
      [BUDGET_CHART_TAG]: BudgetChart, // ```budget-chart の図（Server Component）
      [GLOSSARY_TERM_TAG]: GlossaryTerm, // ことばの印（Client Component。タップで説明を出す）
    },
  });
}
