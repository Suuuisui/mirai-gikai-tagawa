import { Info } from "lucide-react";
import type { Route } from "next";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TextLink } from "@/components/ui/text-link";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import {
  SOURCE_KIND_ORDER,
  type SourceKind,
} from "@/features/sources/shared/data/source-kinds";
import { routes } from "@/lib/routes";
import { CommitteeExplorer } from "../../client/components/committee-explorer";
import type { CommitteeMeetingListItem } from "../../shared/types";
import { countMeetingsBySourceKind } from "../../shared/utils/committee-source";

interface CommitteeMeetingListPageProps {
  meetings: CommitteeMeetingListItem[];
}

/** 出典の区分ごとの、件数に添える言い方 */
const SOURCE_COUNT_LABELS: Record<SourceKind, string> = {
  official: "会議録をもとにした記録",
  transcript: "YouTube中継をもとにした記録",
  disclosure: "開示文書をもとにした記録",
};

export function CommitteeMeetingListPage({
  meetings,
}: CommitteeMeetingListPageProps) {
  const sourceCounts = countMeetingsBySourceKind(meetings);

  return (
    <div data-wide-column>
      {/* ページタイトル（薄青の色面） */}
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
            <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <p>
                  各ページの見出し・要約・要点は、それぞれの記録に示した資料（公式の会議録、
                  公式YouTube中継の文字起こし、情報開示請求で入手した文書）をもとに、
                  運営者がAIを活用して整理したものです。中継の文字起こしには聞き取りの
                  誤りが含まれることがあります。正確な内容は原本・中継映像をご確認ください。
                </p>
                <TextLink href={routes.sources() as Route} className="text-xs">
                  出典の種類と読み方について
                </TextLink>
              </div>
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
