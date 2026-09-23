import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeneralQuestionSessionPage } from "@/features/general-questions/server/components/general-question-session-page";
import {
  getQuestionLinkContext,
  getQuestionSessionGroups,
} from "@/features/general-questions/server/loaders/get-general-questions";
import { routes } from "@/lib/routes";

interface QuestionSessionPageProps {
  params: Promise<{ sessionKey: string }>;
}

// ISR: 静的データが主だが、リンク解決にキャッシュ済みのDBデータを使う
export const revalidate = 3600;

// 全パスをリクエスト時に生成してキャッシュする（オンデマンドISR）
export function generateStaticParams() {
  return [];
}

function findGroups(sessionKey: string) {
  const groups = getQuestionSessionGroups();
  const index = groups.findIndex((group) => group.sessionKey === sessionKey);
  if (index === -1) return null;
  return {
    group: groups[index],
    // groups は新しい順なので、次の要素が古い会期・前の要素が新しい会期
    older: groups[index + 1] ?? null,
    newer: groups[index - 1] ?? null,
  };
}

export async function generateMetadata({
  params,
}: QuestionSessionPageProps): Promise<Metadata> {
  const { sessionKey } = await params;
  const found = findGroups(sessionKey);
  if (!found) return { title: "一般質問が見つかりません" };
  const members = found.group.records.map((r) => r.memberName).join("・");
  const title = `田川市議会 ${found.group.sessionName}の一般質問`;
  const description = `${found.group.sessionName}で${found.group.records.length}人の議員が通告した一般質問の質問事項と要旨。質問者: ${members}`;
  return {
    title,
    description,
    alternates: { canonical: routes.questionSession(sessionKey) },
    openGraph: {
      title,
      description,
      siteName: "みらい議会＠田川市",
      url: routes.questionSession(sessionKey),
    },
  };
}

export default async function QuestionSessionPage({
  params,
}: QuestionSessionPageProps) {
  const { sessionKey } = await params;
  const found = findGroups(sessionKey);
  if (!found) notFound();
  const context = await getQuestionLinkContext();
  return (
    <GeneralQuestionSessionPage
      group={found.group}
      older={found.older}
      newer={found.newer}
      context={context}
    />
  );
}
