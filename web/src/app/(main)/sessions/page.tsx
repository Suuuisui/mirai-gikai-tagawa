import type { Metadata } from "next";
import { SessionArchiveLayout } from "@/features/diet-sessions/server/components/session-archive/session-archive-layout";
import { getSessionArchive } from "@/features/diet-sessions/server/loaders/get-session-archive";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_COPY.sessions.title,
    description: PAGE_COPY.sessions.description,
    alternates: {
      canonical: routes.sessionArchive(),
    },
    ...buildPageShareMetadata({
      ...PAGE_COPY.sessions,
      path: routes.sessionArchive(),
    }),
  };
}

export default async function SessionArchivePage() {
  const items = await getSessionArchive();

  return <SessionArchiveLayout items={items} />;
}
