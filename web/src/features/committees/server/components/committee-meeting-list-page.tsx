import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { SOURCE_KIND_ORDER } from "@/features/sources/shared/data/source-kinds";
import { routes } from "@/lib/routes";
import { CommitteeExplorer } from "../../client/components/committee-explorer";
import type { CommitteeMeetingListItem } from "../../shared/types";
import {
  countMeetingsBySourceKind,
  SOURCE_COUNT_LABELS,
} from "../../shared/utils/committee-source";
import { CommitteeSourceNote } from "./committee-source-note";

interface CommitteeMeetingListPageProps {
  meetings: CommitteeMeetingListItem[];
}

export function CommitteeMeetingListPage({
  meetings,
}: CommitteeMeetingListPageProps) {
  const sourceCounts = countMeetingsBySourceKind(meetings);

  return (
    <div data-wide-column>
      {/* ページタイトル（キーカラーの薄い色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">委員会の記録</h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            議案の中身は、本会議ではなく委員会で審査されます。委員会の会議録は公式には
            公開されていないため、公式YouTube中継の文字起こしと、情報開示請求で入手した
            文書からまとめています。本会議は、公式の会議録が公開された日から順に、
            会議録をもとにした記録に置き換えています。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              {meetings.length}回の会議
            </span>
            {SOURCE_KIND_ORDER.filter((kind) => sourceCounts[kind] > 0).map(
              (kind) => (
                <SourceBadge
                  key={kind}
                  kind={kind}
                  detail={`${SOURCE_COUNT_LABELS[kind]} ${sourceCounts[kind]}回`}
                  className="px-3 py-1.5"
                />
              )
            )}
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
            <CommitteeExplorer meetings={meetings} />

            {/* 出典・注意書き */}
            <CommitteeSourceNote />
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
