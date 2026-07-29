import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

// 常に別URLへredirectするだけの旧URL互換ルートのためnoindex
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface ChatLogPageProps {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

export default async function ChatLogPage({
  params,
  searchParams,
}: ChatLogPageProps) {
  const { reportId } = await params;
  const { from } = await searchParams;

  const reportPath =
    from === "complete"
      ? routes.reportComplete(reportId)
      : routes.publicReport(reportId);
  const search = from === "opinions" ? "?from=opinions" : "";

  redirect(`${reportPath}${search}#chat-log` as Route);
}
