import { SectionHeading } from "@/components/ui/section-heading";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { LinkButton } from "./link-button";

export function About() {
  return (
    <div id="about" className="py-10 scroll-mt-24">
      <div className="flex flex-col gap-4">
        {/* ヘッダー */}
        <SectionHeading>みらい議会とは</SectionHeading>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-bold leading-[43.2px]">
              田川市議会での議論を
              <br />
              できる限りわかりやすく
            </h3>
            <p className="text-[15px] leading-[28px] text-black">
              みらい議会＠田川市は、田川市議会で今どんな議案が検討されているか、わかりやすく伝えるプラットフォームです。市民の意見を政治に届けることを目指して、継続的にアップデートしていきます。
            </p>
          </div>

          {/* もっと詳しく知るボタン */}
          <LinkButton
            href={EXTERNAL_LINKS.ABOUT_NOTE}
            icon={{
              src: "/icons/note-icon.png",
              alt: "note",
              width: 25,
              height: 25,
            }}
          >
            みらい議会とは
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
