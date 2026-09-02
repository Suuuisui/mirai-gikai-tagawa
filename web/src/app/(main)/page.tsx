import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { About } from "@/components/top/about";
import { Hero } from "@/components/top/hero";
import { MayorBanner } from "@/components/top/mayor-banner";
import {
  SectionJumpNav,
  TOP_SECTION_IDS,
} from "@/components/top/section-jump-nav";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { PreviousSessionSection } from "@/features/bills/server/components/previous-session-section";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import type { BillWithContent } from "@/features/bills/shared/types";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { CurrentDietSession } from "@/features/diet-sessions/client/components/current-diet-session";
import { getCurrentDietSession } from "@/features/diet-sessions/server/loaders/get-current-diet-session";
import { getJapanTime } from "@/lib/utils/date";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

export const metadata: Metadata = {
  // 検索意図「田川市議会」に合わせ、トップだけはサイト名先行の
  // defaultタイトルを使わず絶対指定にする
  title: {
    absolute: "田川市議会の議案・議決結果をやさしく解説｜みらい議会＠田川市",
  },
  description:
    "田川市議会に提出された議案・予算・条例・意見書をAIがやさしい言葉で解説。議決結果、議員ごとの賛否、会期（定例会・臨時会）ごとのまとめを無料で確認できます。",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const { billsByTag, featuredBills, previousSessionData } =
    await loadHomeData();

  // ゆくゆくタグ機能がマージされたらBFFに統合する
  const now = getJapanTime();
  const [currentSession, currentDifficulty] = await Promise.all([
    getCurrentDietSession(now),
    getDifficultyLevel(),
  ]);

  const toBillChatContext = (bill: BillWithContent) => {
    return {
      id: bill.id,
      name: `${bill.bill_content?.title}（${bill.name}）`,
      summary: bill.bill_content?.summary,
      tags: bill.tags?.map((tag) => tag.label) || [],
      isFeatured: featuredBills.some((b) => b.id === bill.id),
    };
  };

  return (
    <>
      <Hero />

      {/* 本日の田川市議会セクション */}
      <CurrentDietSession session={currentSession} />

      {/* 新市長の特設ページへの導線（市長交代直後で関心が高い） */}
      <MayorBanner now={now} />

      {/* 議案一覧セクション */}
      <Container className="">
        <div className="py-10">
          <main className="flex flex-col gap-16">
            {/* セクションジャンプナビ（トップが長いため各カテゴリへ直接移動できる） */}
            <SectionJumpNav
              tagLabels={billsByTag.map(({ tag }) => tag.label)}
              hasPreviousSession={previousSessionData != null}
            />

            {/* 注目の議案セクション */}
            <FeaturedBillSection bills={featuredBills} />

            {/* タグ別議案一覧セクション */}
            <BillsByTagSection billsByTag={billsByTag} />
          </main>
        </div>
      </Container>

      {/* 前回の田川市議会セクション（Archive） */}
      {previousSessionData && (
        <div
          id={TOP_SECTION_IDS.previousSession}
          className="bg-mirai-surface-muted py-10 scroll-mt-36"
        >
          <Container>
            <PreviousSessionSection
              session={previousSessionData.session}
              bills={previousSessionData.bills}
              totalBillCount={previousSessionData.totalBillCount}
            />
          </Container>
        </div>
      )}

      <Container>
        {/* みらい議会とは セクション */}
        <About />

        {/* 免責事項 */}
        <BillDisclaimer />
      </Container>

      {/* チャット機能 */}
      <HomeChatClient
        currentDifficulty={currentDifficulty}
        bills={billsByTag
          .flatMap((x) => x.bills)
          .concat(featuredBills)
          .map(toBillChatContext)}
      />
    </>
  );
}
