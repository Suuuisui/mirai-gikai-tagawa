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
import { rehypeEmbedYouTube } from "./rehype-embed-youtube";
import { rehypeExternalLinks } from "./rehype-external-links";
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
    .use(rehypeExternalLinks)
    .use(rehypeEmbedYouTube)
    .run(mdast);

  // hast → React Element（部分水和）
  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: {
      LongPressSection, // Client Componentとして水和
    },
  });
}
