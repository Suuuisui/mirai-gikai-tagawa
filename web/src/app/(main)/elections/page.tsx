import type { Metadata } from "next";
import { ElectionTurnoutPage } from "@/features/elections/server/components/election-turnout-page";
import { routes } from "@/lib/routes";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

const TITLE = "田川市の選挙の投票率（年代別・投票区別）";
const DESCRIPTION =
  "令和8年7月12日の田川市長選挙と市議会議員補欠選挙の投票率を、年代別（1歳刻み）・投票区別・期日前投票の割合で見られます。年代別の票の数（投票した人の数）、令和5年の市議会議員選挙との比較、これまでの投票率の移り変わりもまとめています。市選挙管理委員会への情報開示請求で入手した資料が出典です。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: routes.elections(),
  },
  ...buildPageShareMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: routes.elections(),
  }),
};

export default function ElectionsPage() {
  return <ElectionTurnoutPage />;
}
