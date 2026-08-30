import { FileText, Info, Youtube } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { CommitteeGroupSection } from "../../client/components/committee-group-section";
import {
  COMMITTEE_KIND_LABELS,
  type CommitteeKind,
} from "../../shared/data/committee-profiles";
import type { CommitteeMeetingSummary } from "../../shared/types";
import { buildCommitteeGroups } from "../../shared/utils/committee-groups";

interface CommitteeMeetingListPageProps {
  meetings: CommitteeMeetingSummary[];
}

/** 表示する種別の順番 */
const KIND_SECTIONS: CommitteeKind[] = ["standing", "special", "other"];

const KIND_DESCRIPTIONS: Record<CommitteeKind, string> = {
  standing:
    "分野ごとに常設されている委員会です。本会議で決める前に、議案をここで詳しく審査します。",
  special:
    "特定の問題を調べるために期間を決めて設置された委員会です。市政の疑惑を検証しています。",
  other: "議員全員が集まる会議や、市民向けの報告会の記録です。",
};

export function CommitteeMeetingListPage({
  meetings,
}: CommitteeMeetingListPageProps) {
  const groups = buildCommitteeGroups(meetings);
  const disclosureCount = meetings.filter(
    (m) => m.source_type === "disclosure"
  ).length;
  const youtubeCount = meetings.length - disclosureCount;

  return (
    <div data-wide-column>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">委員会の記録</h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            田川市議会の委員会は、本会議で議案を決める前に中身を詳しく審査する場です。
            しかし議事録は公式には公開されていません。このページでは、情報開示請求で入手した文書と
            公式YouTube中継をもとに、審議の内容をまとめて公開しています。
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
        {groups.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            委員会の記録はまだありません
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 委員会へのジャンプナビ（一覧が長いため先頭で全体像を示す） */}
            <nav aria-label="委員会一覧" className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.committeeName}
                  href={`#committee-${encodeURIComponent(group.committeeName)}`}
                  className="rounded-lg border border-mirai-border bg-white px-3 py-1.5 text-[13px] font-medium text-mirai-text-secondary transition-colors hover:bg-mirai-surface-key"
                >
                  {group.shortName}
                  <span className="ml-1 text-mirai-text-muted">
                    {group.meetings.length}
                  </span>
                </a>
              ))}
            </nav>

            {KIND_SECTIONS.map((kind) => {
              const kindGroups = groups.filter((g) => g.kind === kind);
              if (kindGroups.length === 0) return null;
              return (
                <section key={kind} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <SectionHeading>
                      {COMMITTEE_KIND_LABELS[kind]}
                    </SectionHeading>
                    <p className="text-xs leading-relaxed text-mirai-text-muted">
                      {KIND_DESCRIPTIONS[kind]}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {kindGroups.map((group) => (
                      <CommitteeGroupSection
                        key={group.committeeName}
                        group={group}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* 出典・注意書き */}
            <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                各ページの要約・要点は、情報開示請求で入手した文書または公式YouTube中継の
                自動字幕をもとに、運営者がAIを活用して整理したものです。正確な内容は原本・
                中継映像をご確認ください。
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
