import { Info } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";
import { MAYOR_PROFILE } from "../../../shared/data/mayor-profile";
import { compactName } from "../../../shared/utils/mayor-activity";
import type { MayorActivity } from "../../loaders/get-mayor-activity";
import { ActivitySection } from "./activity-section";
import { BillsSection } from "./bills-section";
import { CareerSection } from "./career-section";
import { ElectionSection } from "./election-section";
import { HeroSection } from "./hero-section";
import { TimelineSection } from "./timeline-section";

interface MayorPageProps {
  activity: MayorActivity;
  /** JST基準の現在時刻（就任日数・年齢の計算に使う） */
  now: Date;
}

export function MayorPage({ activity, now }: MayorPageProps) {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: compactName(MAYOR_PROFILE.name),
    jobTitle: "田川市長",
    url: new URL(routes.mayor(), env.webUrl).toString(),
    sameAs: [MAYOR_PROFILE.officialProfileUrl],
    worksFor: {
      "@type": "GovernmentOrganization",
      name: "田川市",
    },
  };

  return (
    <div data-wide-column>
      <JsonLd data={personJsonLd} />
      <HeroSection now={now} />

      <Container className="py-8">
        <div className="flex flex-col gap-12">
          <ActivitySection meetings={activity.meetingsSinceInauguration} />
          <BillsSection
            bills={activity.billsSinceInauguration}
            upcoming={activity.upcoming}
          />
          <TimelineSection timeline={activity.timeline} />
          <ElectionSection />
          <CareerSection />

          {/* 注意書き */}
          <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              このページは、田川市公式サイト・市の投開票速報・当サイトの委員会記録
              （情報開示請求文書と公式YouTube中継の自動字幕をAIで整理したもの）をもとに
              運営者が作成しています。市の公式見解ではありません。正確な内容は各出典をご確認ください。
            </p>
          </div>
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "新市長の動き" },
          ]}
        />
      </Container>
    </div>
  );
}
