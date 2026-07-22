import Image from "next/image";
import { Container } from "@/components/layouts/container";

export function Hero() {
  return (
    <div className="relative w-full h-[55vh] min-h-[440px] md:h-[50vh]">
      <Image
        src="/img/hero_background.png"
        alt="田川市議会・田川のまちなみ"
        fill
        priority
        className="object-cover"
        sizes="100vw"
        quality={85}
      />
      {/* 見出しはflexで縦中央寄せ。下部のスクロールインジケーターと
          重ならないよう、その分の余白をpbで確保する。
          lg未満は2段ヘッダー（フローティング）に見出しが隠れないよう、
          ヘッダー高ぶんの上余白を確保する */}
      <div className="relative flex h-full flex-col justify-center pt-36 pb-16 lg:pt-0">
        <Container>
          {/* 文節単位のinline-blockで、拡大フォント環境でも語の途中で折り返さないようにする */}
          <h1 className="font-bold text-xl md:text-2xl leading-relaxed">
            <span className="inline-block">いま田川市議会で</span>{" "}
            <span className="inline-block">議論されていること</span>
            <br />
            <span className="inline-block">やさしい言葉で</span>{" "}
            <span className="inline-block">説明します</span>
          </h1>
          <p className="mt-2 font-lexend text-xs">powered by AI</p>
        </Container>
      </div>

      {/* スクロールインジケーター */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-gentle">
        <div className="w-[1px] h-[34px] bg-black"></div>
        <p className="mt-2 font-lexend text-[10px] leading-[20px] text-black">
          Scroll
        </p>
      </div>
    </div>
  );
}
