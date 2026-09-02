import type { Metadata } from "next";
import { MayorPage } from "@/features/mayor/server/components/mayor-page/mayor-page";
import { getMayorActivity } from "@/features/mayor/server/loaders/get-mayor-activity";
import { MAYOR_PROFILE } from "@/features/mayor/shared/data/mayor-profile";
import { compactName } from "@/features/mayor/shared/utils/mayor-activity";
import { routes } from "@/lib/routes";
import { formatDate, getJapanTime } from "@/lib/utils/date";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 「就任N日目」など日付起因の表示は最長10分で追従する
export const revalidate = 600;

const MAYOR_NAME = compactName(MAYOR_PROFILE.name);
const TITLE = `${MAYOR_NAME} 田川市長の動き｜就任後の議会・提出議案・就任までの経緯`;
const DESCRIPTION = `${formatDate(MAYOR_PROFILE.inaugurationDate)}に就任した${MAYOR_NAME} 田川市長の、就任後の議会での動き・市長提出議案・前市長の退職から市長選までの経緯を、委員会の記録と公式データからまとめています。`;

export const metadata: Metadata = {
  title: { absolute: `${TITLE}｜みらい議会＠田川市` },
  description: DESCRIPTION,
  alternates: {
    canonical: routes.mayor(),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "みらい議会＠田川市",
    url: routes.mayor(),
  },
};

export default async function MayorRoutePage() {
  const now = getJapanTime();
  const activity = await getMayorActivity(now);
  return <MayorPage activity={activity} now={now} />;
}
