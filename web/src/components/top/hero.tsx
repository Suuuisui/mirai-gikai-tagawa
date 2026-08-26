import Image from "next/image";
import { Container } from "@/components/layouts/container";

export function Hero() {
  return (
    <div className="w-full bg-mirai-surface-key md:rounded-lg">
      {/* md未満は固定ヘッダー（2段）に見出しが隠れないよう
          ヘッダー高ぶんの上余白を確保する。md以上はmain-layoutのmtが効く */}
      <div className="relative overflow-hidden pt-36 pb-12 md:pt-14 md:pb-16">
        {/* 二本煙突のシンボル（装飾）。テキストと重ならないよう右下に配置 */}
        <Image
          src="/img/hero-symbol.svg"
          alt=""
          aria-hidden
          width={260}
          height={190}
          className="pointer-events-none absolute -bottom-2 right-0 hidden h-auto w-[220px] sm:block md:w-[240px] lg:right-4"
        />
        <Container>
          <div className="relative flex flex-col gap-4">
            {/* 文節単位のinline-blockで、拡大フォント環境でも語の途中で折り返さないようにする */}
            <h1 className="font-bold text-2xl md:text-3xl leading-relaxed text-mirai-text">
              <span className="inline-block">いま田川市議会で</span>{" "}
              <span className="inline-block">議論されていること</span>
              <br />
              <span className="inline-block">やさしい言葉で</span>{" "}
              <span className="inline-block">説明します</span>
            </h1>
            <p className="max-w-[420px] text-sm leading-relaxed text-mirai-text-secondary md:text-base">
              議案の要点をAIが整理してお届けします。議案の検索、議会ごとのまとめ、AIへの質問ができます。
            </p>
          </div>
        </Container>
      </div>
    </div>
  );
}
