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

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）。
// これが無いと動的パラメータルートはISR対象にならず毎回SSRされる
export function generateStaticParams() {
  return [];
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
