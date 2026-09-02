import { FileText, Info, Youtube } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import { CommitteeExplorer } from "../../client/components/committee-explorer";
import type { CommitteeMeetingSummary } from "../../shared/types";
import { toListItems } from "../../shared/utils/committee-list";

interface CommitteeMeetingListPageProps {
  meetings: CommitteeMeetingSummary[];
}

export function CommitteeMeetingListPage({
  meetings,
}: CommitteeMeetingListPageProps) {
  const disclosureCount = meetings.filter(
    (meeting) => meeting.source_type === "disclosure"
  ).length;
  const youtubeCount = meetings.length - disclosureCount;

  return (
    <div data-wide-column>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">委員会の記録</h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            議案の中身は、本会議ではなく委員会で審査されます。その議事録は公式には
            公開されていないため、情報開示請求と公式YouTube中継からまとめました。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              {meetings.length}回の会議
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              <FileText aria-hidden className="size-3.5" />
              開示文書 {disclosureCount}件
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              <Youtube aria-hidden className="size-3.5" />
              中継字幕 {youtubeCount}件
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {meetings.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            委員会の記録はまだありません
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            <CommitteeExplorer meetings={toListItems(meetings)} />

            {/* 出典・注意書き */}
            <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                各ページの見出し・要約・要点は、情報開示請求で入手した文書または
                公式YouTube中継の自動字幕をもとに、運営者がAIを活用して整理した
                ものです。正確な内容は原本・中継映像をご確認ください。
              </p>
            </div>
          </div>
        )}
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "委員会の記録" },
          ]}
        />
      </Container>
    </div>
  );
}
