import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionSummaryLayout } from "@/features/diet-sessions/server/components/session-summary/session-summary-layout";
import { getSessionSummary } from "@/features/diet-sessions/server/loaders/get-session-summary";
import { routes } from "@/lib/routes";

interface SessionSummaryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: SessionSummaryPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getSessionSummary(id);

  if (!data) {
    return {
      title: "会期が見つかりません",
    };
  }

  const { session } = data;
  const description = `${session.name}で審議された議案の集計・ハイライトをまとめて紹介します。`;

  return {
    title: `${session.name}のまとめ`,
    description,
    alternates: {
      canonical: routes.sessionSummary(session.id),
    },
  };
}

export default async function SessionSummaryPage({
  params,
}: SessionSummaryPageProps) {
  const { id } = await params;
  const data = await getSessionSummary(id);

  if (!data) {
    notFound();
  }

  return <SessionSummaryLayout session={data.session} bills={data.bills} />;
}
