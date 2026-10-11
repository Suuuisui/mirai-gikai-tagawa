import type { Route } from "next";
import { SourceNote } from "@/components/ui/source-note";
import { TextLink } from "@/components/ui/text-link";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { routes } from "@/lib/routes";

/** 一般質問とは何か（一覧・会期ページの冒頭で共通に使う説明）と、このページのもとの資料 */
export function QuestionIntro() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-mirai-text-secondary">
        一般質問は、定例会ごとに議員が市長や市の担当部署に対して市政全般について質問する場です。
        質問する内容は事前に「通告」され、公式サイトに一覧が公開されます。
        ここでは通告された質問事項と要旨に、録画・公式の会議録・本会議の記録への導線を添えています。
      </p>
      <SourceBadge
        kind="official"
        detail="一般質問の一覧と通告書"
        className="bg-white"
      />
    </div>
  );
}

/** 出典と注意書き */
export function QuestionSourceNote() {
  return (
    <SourceNote>
      質問事項は田川市公式サイトの「一般質問一覧」、要旨は各会期の通告書PDF、録画は田川市議会の公式YouTubeチャンネルをもとに機械的に整理したものです。
      実際の質問・答弁の内容は、録画や公式の会議録（会議録検索システム。公開されている日は各日の見出しから開けます）をご確認ください。
      <TextLink href={routes.sources() as Route} className="ml-1">
        出典の種類と読み方について
      </TextLink>
    </SourceNote>
  );
}
