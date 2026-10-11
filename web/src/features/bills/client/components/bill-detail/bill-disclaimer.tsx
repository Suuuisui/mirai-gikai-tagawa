import { LinkButton } from "@/components/top/link-button";
import { TextLink } from "@/components/ui/text-link";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { routes } from "@/lib/routes";

export function BillDisclaimer() {
  return (
    <div className="space-y-6 pt-4 pb-10">
      {/* データの出典について */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-black">掲載コンテンツについて</h3>
        <p className="text-xs leading-relaxed text-mirai-text-note">
          掲載されている議案情報は、田川市議会に提出された議案・議決結果・本会議の会議録などの公開情報を基に、みらい議会＠田川市の運営者がAIを活用しながら背景情報を整理したものです。会議録が公開される前の直近の会期は、公式YouTube中継の文字起こしを使っています。この議案が何をもとにしているかは、ページ上部の「この議案の情報のもと」と本文末尾の「出典」に示しています。
        </p>
        <TextLink href={routes.sources()} className="text-xs">
          出典の種類と読み方について
        </TextLink>
      </div>

      {/* 掲載コンテンツについての免責事項 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-black">免責事項</h3>
        <p className="text-xs leading-relaxed text-mirai-text-note">
          本サイトで公開する情報は、可能な限り正確かつ最新の情報を反映するよう努めていますが、その正確性・完全性・即時性について保証するものではありません。また、AIチャットは不正確または誤解を招く回答を生成する可能性があります。正確な情報は、公式文書や一次資料をご確認ください。
        </p>
      </div>

      <LinkButton
        href={EXTERNAL_LINKS.FAQ}
        icon={{
          src: "/icons/question-bubble.svg",
          alt: "note",
          width: 22,
          height: 22,
        }}
      >
        よくある質問
      </LinkButton>
    </div>
  );
}
