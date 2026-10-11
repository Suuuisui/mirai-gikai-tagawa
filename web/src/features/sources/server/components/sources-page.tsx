import type { Route } from "next";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JumpNav, jumpTargetClassName } from "@/components/ui/jump-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import type { CommitteeMeetingListItem } from "@/features/committees/shared/types";
import { countMeetingsBySourceKind } from "@/features/committees/shared/utils/committee-source";
import { officialMinutesIndex } from "@/features/official-minutes/shared/utils/official-minutes-index";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatDateWithDots } from "@/lib/utils/date";
import { SourceBadge } from "../../shared/components/source-badge";
import {
  SOURCE_KIND_ORDER,
  SOURCE_KINDS,
  type SourceKind,
} from "../../shared/data/source-kinds";
import {
  DISCLOSURE_STATUS,
  SOURCE_ORIGINS,
  SOURCE_USAGES,
} from "../../shared/data/source-usage";

interface SourcesPageProps {
  /** 委員会の記録（出典の区分ごとの件数を数える） */
  meetings: readonly CommitteeMeetingListItem[];
}

const SECTION_IDS: Record<SourceKind, string> = {
  official: "official",
  transcript: "transcript",
  disclosure: "disclosure",
};
const PRIORITY_SECTION_ID = "priority";

const JUMP_ENTRIES = [
  ...SOURCE_KIND_ORDER.map((kind) => ({
    label: SOURCE_KINDS[kind].label,
    href: `#${SECTION_IDS[kind]}`,
  })),
  { label: "複数あるときの優先順", href: `#${PRIORITY_SECTION_ID}` },
];

/** 区分1つ分の説明（何の資料か・注意・どこで使っているか・もとの資料の入口） */
function SourceKindSection({
  kind,
  children,
}: {
  kind: SourceKind;
  children?: React.ReactNode;
}) {
  const info = SOURCE_KINDS[kind];
  const origins = SOURCE_ORIGINS[kind];
  return (
    <section
      id={SECTION_IDS[kind]}
      className={cn(jumpTargetClassName, "flex flex-col gap-4")}
    >
      <SectionHeading>{info.label}</SectionHeading>
      <div className="flex flex-col gap-3">
        <SourceBadge kind={kind} className="px-2.5 py-1" />
        <p className="text-sm leading-relaxed text-mirai-text">
          {info.description}
        </p>
        <p className="rounded-lg bg-mirai-surface px-4 py-3 text-sm leading-relaxed text-mirai-text-secondary">
          <span className="font-bold">読むときの注意: </span>
          {info.caution}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-mirai-text-secondary">
          このサイトでの使いみち
        </h3>
        <ul className="flex flex-col divide-y divide-mirai-border-muted border-y border-mirai-border-muted">
          {SOURCE_USAGES[kind].map((usage) => (
            <li
              key={usage.material}
              className="flex flex-col gap-1 py-3 text-sm leading-relaxed"
            >
              <span className="font-bold text-mirai-text">
                {usage.material}
              </span>
              <span className="text-mirai-text-secondary">{usage.usedFor}</span>
              {usage.page && (
                <TextLink href={usage.page.href as Route} className="text-xs">
                  {usage.page.label}を見る
                </TextLink>
              )}
            </li>
          ))}
        </ul>
      </div>

      {children}

      {origins.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-mirai-text-secondary">
            もとの資料を自分で確かめる
          </h3>
          <ul className="flex flex-col gap-1.5">
            {origins.map((origin) => (
              <li key={origin.url}>
                <TextLink external href={origin.url} className="text-sm">
                  {origin.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** 補足の小さな箱（いまの件数や状況） */
function FactBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-mirai-border-muted bg-white px-4 py-3.5 text-sm leading-relaxed text-mirai-text-secondary">
      {children}
    </div>
  );
}

/**
 * 情報のもと（出典）の説明ページ（/sources）。
 * サイト全体で使う3つの区分が、それぞれ何の資料で、どこに使われ、
 * どう読めばよいかをまとめる。各ページの出典バッジからここに来る
 */
export function SourcesPage({ meetings }: SourcesPageProps) {
  const meetingCounts = countMeetingsBySourceKind(meetings);
  const { latestDate, count: minutesCount } = officialMinutesIndex;

  return (
    <div>
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="flex flex-col gap-5 py-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-mirai-text">
              情報のもと（出典）について
            </h1>
            <p className="text-sm leading-relaxed text-mirai-text-secondary">
              このサイトに載せている内容は、次の3種類の資料をもとにしています。
              ページや記録ごとに、どれがもとになっているかを同じ色と名前のバッジで示しています。
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {SOURCE_KIND_ORDER.map((kind) => (
              <li key={kind}>
                <SourceBadge kind={kind} className="px-2.5 py-1" />
              </li>
            ))}
          </ul>
          <JumpNav entries={JUMP_ENTRIES} />
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-12">
          <SourceKindSection kind="official">
            {latestDate && (
              <FactBox>
                <p>
                  本会議の会議録は、平成10年から
                  <span className="font-bold text-mirai-text">
                    {formatDateWithDots(latestDate)}
                  </span>
                  の会議の分まで公開されています（{minutesCount}日分）。
                  それより後の本会議は、会議録が公開されるまで中継の文字起こしをもとにしています。
                </p>
                <p>
                  会議録検索システムに載っているのは本会議だけで、委員会の会議録は載っていません。
                </p>
              </FactBox>
            )}
          </SourceKindSection>

          <SourceKindSection kind="transcript">
            <FactBox>
              <p>
                委員会の記録{meetings.length}回のうち、
                <span className="font-bold text-mirai-text">
                  {meetingCounts.transcript}回
                </span>
                が中継の文字起こしをもとにしています（会議録がもとの記録は
                {meetingCounts.official}回、開示文書がもとの記録は
                {meetingCounts.disclosure}回）。
              </p>
              <p>
                議員の名前や地名は名簿と照らして直し、数字は文字起こしの中にあるものだけを書いていますが、
                聞き取りの誤りが残ることがあります。各記録のページから中継の録画を開けます。
              </p>
            </FactBox>
          </SourceKindSection>

          <SourceKindSection kind="disclosure">
            <FactBox>
              <p className="font-bold text-mirai-text">
                請求の状況（{DISCLOSURE_STATUS.asOf}時点）
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-mirai-text-muted">
                  届いて、サイトに載せているもの
                </p>
                <ul className="list-disc pl-5">
                  {DISCLOSURE_STATUS.received.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-mirai-text-muted">
                  請求していて、まだ届いていないもの
                </p>
                <ul className="list-disc pl-5">
                  {DISCLOSURE_STATUS.requested.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p>
                文書が届いたら、中継の文字起こしをもとにした記録を、文書をもとにした記録に置き換えていきます。
              </p>
            </FactBox>
          </SourceKindSection>

          <section
            id={PRIORITY_SECTION_ID}
            className={cn(jumpTargetClassName, "flex flex-col gap-4")}
          >
            <SectionHeading>同じ会議に複数の資料があるとき</SectionHeading>
            <p className="text-sm leading-relaxed text-mirai-text">
              正確さの高い資料を優先します。より正確な資料が手に入ったら、記録を作り直してバッジも付け替えます。
            </p>
            <ol className="flex flex-col gap-2">
              {(
                [
                  ["official", "公式の会議録や、市が公開しているページ・資料"],
                  ["disclosure", "情報開示請求で交付を受けた文書"],
                  ["transcript", "中継の文字起こし（ほかに資料が無いとき）"],
                ] as const
              ).map(([kind, text], index) => (
                <li
                  key={kind}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-mirai-border-muted bg-white px-4 py-3 text-sm leading-relaxed text-mirai-text-secondary"
                >
                  <span className="font-bold text-mirai-text">
                    {index + 1}.
                  </span>
                  <SourceBadge kind={kind} />
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm leading-relaxed text-mirai-text-secondary">
              どの資料がもとでも、見出し・要約・解説は運営者（田川市政ラボ）がAIを使って書いたもので、
              市や市議会の公式の見解ではありません。数字・人名・採決の結果はもとの資料と照らして確かめていますが、
              誤りに気づかれた場合は
              <TextLink href={routes.privacy() as Route} className="mx-1">
                お問い合わせ窓口
              </TextLink>
              までお知らせください。
            </p>
          </section>
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "情報のもと（出典）について" },
          ]}
        />
      </Container>
    </div>
  );
}
