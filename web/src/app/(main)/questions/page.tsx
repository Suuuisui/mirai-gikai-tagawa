import type { Metadata } from "next";
import { GeneralQuestionListPage } from "@/features/general-questions/server/components/general-question-list-page";
import {
  getQuestionLinkContext,
  getQuestionSessionGroups,
} from "@/features/general-questions/server/loaders/get-general-questions";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: 質問データは静的（デプロイで更新）、会期・議員・委員会記録へのリンク解決は
// キャッシュ済みのDBデータを使い、そちらの更新は /api/revalidate で反映される
export const revalidate = 3600;

export const metadata: Metadata = {
  title: PAGE_COPY.questions.title,
  description: PAGE_COPY.questions.description,
  alternates: {
    canonical: routes.questions(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.questions,
    path: routes.questions(),
  }),
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
