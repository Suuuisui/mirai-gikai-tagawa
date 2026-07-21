import Image from "next/image";
import { Container } from "@/components/layouts/container";

export function Hero() {
  return (
    <div className="relative w-full h-[55vh] min-h-[360px] md:h-[50vh]">
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
          重ならないよう、その分の余白をpbで確保する */}
      <div className="relative flex h-full flex-col justify-center pb-16">
        <Container>
          <h1 className="font-bold text-xl md:text-2xl leading-relaxed">
            いま田川市議会で議論されていること <br />
            やさしい言葉で説明します
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
