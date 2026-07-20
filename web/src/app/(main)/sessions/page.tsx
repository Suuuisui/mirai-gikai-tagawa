import type { Metadata } from "next";
import { SessionArchiveLayout } from "@/features/diet-sessions/server/components/session-archive/session-archive-layout";
import { getSessionArchive } from "@/features/diet-sessions/server/loaders/get-session-archive";
import { routes } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "議会ごとのまとめ",
    description:
      "田川市議会の全ての会期のまとめページへの入り口です。会期ごとの提出議案数や賛否が分かれた議案数を一覧で確認できます。",
    alternates: {
      canonical: routes.sessionArchive(),
    },
  };
}

export default async function SessionArchivePage() {
  const items = await getSessionArchive();

  return <SessionArchiveLayout items={items} />;
}
