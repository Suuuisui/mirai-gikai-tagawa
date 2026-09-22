import type { Metadata } from "next";
import { GeneralQuestionListPage } from "@/features/general-questions/server/components/general-question-list-page";
import {
  getQuestionLinkContext,
  getQuestionSessionGroups,
} from "@/features/general-questions/server/loaders/get-general-questions";
import { routes } from "@/lib/routes";

// ISR: 質問データは静的（デプロイで更新）、会期・議員・委員会記録へのリンク解決は
// キャッシュ済みのDBデータを使い、そちらの更新は /api/revalidate で反映される
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "田川市議会 一般質問（議員が市に問うこと）",
  description:
    "田川市議会の定例会で議員が市長や市に質問する「一般質問」の通告内容を、平成29年から最新の定例会まで一覧にしました。質問事項・要旨・録画・本会議の記録をまとめて確認できます。",
  alternates: {
    canonical: routes.questions(),
  },
};

export default async function QuestionsPage() {
  const context = await getQuestionLinkContext();
  return (
    <GeneralQuestionListPage
      groups={getQuestionSessionGroups()}
      context={context}
    />
  );
}
