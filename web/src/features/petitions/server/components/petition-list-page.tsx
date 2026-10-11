import type { PetitionRecord } from "@mirai-gikai/shared/council/types";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShowMoreList } from "@/components/ui/show-more-list";
import { SourceNote } from "@/components/ui/source-note";
import { TextLink } from "@/components/ui/text-link";
import { SourceList } from "@/features/sources/shared/components/source-list";
import type { SourceRef } from "@/features/sources/shared/data/source-kinds";
import { routes } from "@/lib/routes";
import { findPetitionNote } from "../../shared/data/petition-notes";
import {
  splitPetitionsByOpen,
  summarizePetitions,
} from "../../shared/utils/petition-display";
import type { PetitionMeetingMatch } from "../../shared/utils/petition-meetings";
import type { PetitionLinkContext } from "../loaders/get-petitions";
import { PetitionCard } from "./petition-card";

interface PetitionListPageProps {
  records: readonly PetitionRecord[];
  context: PetitionLinkContext;
  /** 請願・陳情の id → 審査した会議 */
  meetingMatches: ReadonlyMap<string, readonly PetitionMeetingMatch[]>;
}

const CLOSED_INITIAL_COUNT = 10;
const OFFICIAL_INDEX_URL = "https://www.joho.tagawa.fukuoka.jp/list00713.html";
const MINUTES_SEARCH_URL = "https://www.kensakusystem.jp/tagawa/index.html";

/** このページの各部分が何をもとにしているか（カードの中のバッジと同じ区分） */
const PAGE_SOURCES: readonly SourceRef[] = [
  {
    kind: "official",
    detail: "請願・陳情のページ",
    scope: "件名・上程日・付託先・結果・紹介議員",
    href: OFFICIAL_INDEX_URL,
  },
  {
    kind: "official",
    detail: "請願文・陳情文の原文",
    scope: "要望の内容、提出者が挙げる理由（運営者が平易に書き直したもの）",
  },
  {
    kind: "official",
    detail: "本会議の会議録",
    scope: "審査の結果と理由（委員長報告・討論・採決）",
    href: MINUTES_SEARCH_URL,
  },
  {
    kind: "transcript",
    detail: "YouTube中継",
    scope:
      "審査の経緯（当サイトの委員会の記録。開示文書がもとの記録もあります）",
  },
];

/**
 * 請願・陳情の一覧ページ（/petitions）。
 * 審査中のものを先頭に、これまでの結果を上程日の新しい順に並べる
 */
export function PetitionListPage({
  records,
  context,
  meetingMatches,
}: PetitionListPageProps) {
  const summary = summarizePetitions(records);
  const { open, closed } = splitPetitionsByOpen(records);
  const renderCard = (record: PetitionRecord) => (
    <PetitionCard
      key={record.id}
      record={record}
      context={context}
      note={findPetitionNote(record.id)}
      meetings={meetingMatches.get(record.id) ?? []}
    />
  );

  return (
    <div data-wide-column>
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">
            請願・陳情（市民からの要望）
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
            請願は議員の紹介を受けて、陳情は誰でも、市議会に要望を出せるしくみです。
            出された要望は担当の委員会に付託され、審査のうえ本会議で採択・不採択が決まります。
            採択されると市の執行部に送られたり、国や県への意見書として提出されたりします。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              請願 {summary.seigan}件・陳情 {summary.chinjo}件
            </span>
            <span className="rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              審査中 {summary.open}件
            </span>
            <span className="rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
              採択 {summary.adopted}件（一部採択を含む）
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {records.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            請願・陳情の記録はまだありません
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            <SourceList title="このページの情報のもと" items={PAGE_SOURCES} />

            {open.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <SectionHeading>いま審査中の請願・陳情</SectionHeading>
                  <p className="text-xs font-medium text-mirai-text-muted">
                    委員会で審査中、または次の会期に持ち越された要望です
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {open.map(renderCard)}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <SectionHeading>これまでの結果</SectionHeading>
                <p className="text-xs font-medium text-mirai-text-muted">
                  平成23年5月以降に出された請願・陳情（上程日の新しい順）
                </p>
              </div>
              <ShowMoreList
                initialCount={CLOSED_INITIAL_COUNT}
                className="flex flex-col gap-3"
              >
                {closed.map(renderCard)}
              </ShowMoreList>
            </section>

            <SourceNote>
              田川市公式サイト「請願・陳情」の審査状況と審査結果のページを機械的に整理したものです。
              「要望の内容」と「提出者が挙げる理由」は公開されている原文（PDF）を運営者が平易に書き直したもの、
              「審査の結果と理由」は本会議の会議録（
              <TextLink external href={MINUTES_SEARCH_URL} className="mx-1">
                田川市議会 会議録検索システム
              </TextLink>
              ）の委員長報告・討論・採決を運営者がまとめたもの、
              「審査の経緯」は当サイトの委員会の記録（中継の文字起こしや開示文書の要約）と照合したものです。
              原文（PDF）と最新の審査状況は
              <TextLink external href={OFFICIAL_INDEX_URL} className="mx-1">
                公式サイト
              </TextLink>
              でご確認ください。
            </SourceNote>
          </div>
        )}
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "請願・陳情" },
          ]}
        />
      </Container>
    </div>
  );
}
