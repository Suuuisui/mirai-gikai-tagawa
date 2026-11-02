import { Container } from "@/components/layouts/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { SourceNote } from "@/components/ui/source-note";
import { TextLink } from "@/components/ui/text-link";
import {
  BarGroupRow,
  ChartFigure,
  type ChartSeries,
} from "@/features/elections/server/components/turnout-bars";
import { SourceBadge } from "@/features/sources/shared/components/source-badge";
import { SOURCE_ORIGINS } from "@/features/sources/shared/data/source-usage";
import { routes } from "@/lib/routes";
import {
  ATTENDANCE_SESSIONS,
  type AttendanceSession,
} from "../../shared/data/attendance-data";
import {
  busiestDay,
  reiwaYearLabel,
  sessionTotal,
  yearlyAttendance,
} from "../../shared/utils/attendance";

const SERIES: readonly ChartSeries[] = [
  { label: "傍聴者（延べ）", kind: "focus" },
];
const COUNCIL_SITE = SOURCE_ORIGINS.official[0];
const formatPeople = (n: number) => `${n}人`;

/** 会期名から年と回次を除いた短い名前（例: 3月定例会） */
function shortName(session: AttendanceSession): string {
  return session.name.replace(/^令和\S+年\s*第\S+回\s*/, "");
}

/** 日数と、2日以上あれば最多の日の人数（例: 4日・最多12人） */
function sessionSublabel(session: AttendanceSession): string {
  if (session.days.length === 0) return session.note ?? "";
  const best = busiestDay(session);
  const days = `${session.days.length}日`;
  if (session.note) return `${days}・${session.note}`;
  return best && best.general > 0 && session.days.length > 1
    ? `${days}・最多${best.general}人`
    : days;
}

/**
 * 本会議の傍聴者数のページ（/attendance）。
 * 少なさを責める見せ方にせず、「誰でも傍聴できる」ことと、
 * 実際に何人くらいが来ているかを淡々と並べて、傍聴への一歩を後押しする
 */
export function AttendancePage() {
  const years = yearlyAttendance(ATTENDANCE_SESSIONS);
  const yearMax = Math.max(...years.map((y) => y.total));
  const sessionMax = Math.max(...ATTENDANCE_SESSIONS.map(sessionTotal));
  const sessionsByYear = years.map((y) => ({
    year: y.year,
    sessions: ATTENDANCE_SESSIONS.filter((s) =>
      s.key.startsWith(`r${y.year - 2018}-`)
    ),
  }));

  return (
    <div data-wide-column>
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="flex flex-col gap-4 py-8">
          <h1 className="text-2xl font-bold text-mirai-text">
            本会議の傍聴者数
          </h1>
          <p className="text-sm leading-relaxed text-mirai-text-secondary">
            市議会の本会議は公開されていて、市民はだれでも傍聴できます。令和3年からの本会議に、何人が傍聴に来ていたかをまとめました。議会事務局に情報開示請求をして入手した「傍聴人調」をもとにしています。
          </p>
          <SourceBadge kind="disclosure" detail="傍聴人調" />
          <p className="text-sm leading-relaxed text-mirai-text-secondary">
            日程や傍聴のしかたは
            <TextLink external href={COUNCIL_SITE.url} className="mx-1">
              {COUNCIL_SITE.label}
            </TextLink>
            で確かめられます。一般質問の日程と内容は
            <TextLink href={routes.questions()} className="mx-1">
              一般質問のページ
            </TextLink>
            にあります。
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-4">
            <SectionHeading>年ごとの傍聴者数</SectionHeading>
            <ChartFigure
              title="本会議の傍聴者（延べ人数）"
              note="同じ人が何日も来た場合は、日ごとに数えています。報道関係者は含みません。令和8年は9月24日までの分です。"
            >
              {years.map((y) => (
                <BarGroupRow
                  key={y.year}
                  label={reiwaYearLabel(y.year)}
                  sublabel={`本会議 ${y.meetingDays}日`}
                  series={SERIES}
                  values={[y.total]}
                  max={yearMax}
                  format={formatPeople}
                />
              ))}
            </ChartFigure>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeading>会期ごとの傍聴者数</SectionHeading>
            <p className="text-sm leading-relaxed text-mirai-text-secondary">
              定例会で傍聴者がいちばん多かった日は、22会期のうち少なくとも18会期が一般質問の日でした。
            </p>
            {sessionsByYear.map(({ year, sessions }) => (
              <ChartFigure
                key={year}
                title={reiwaYearLabel(year)}
                note="会期中の本会議の日の傍聴者を足した延べ人数です。「最多」は、いちばん多かった日の人数です。"
              >
                {sessions.map((s) => (
                  <BarGroupRow
                    key={s.key}
                    label={shortName(s)}
                    sublabel={sessionSublabel(s)}
                    series={SERIES}
                    values={[sessionTotal(s)]}
                    max={sessionMax}
                    format={formatPeople}
                  />
                ))}
              </ChartFigure>
            ))}
          </section>

          <SourceNote>
            数字は、田川市議会事務局の「傍聴人調」を転記したものです（令和8年9月24日付の情報開示請求に対し、令和8年10月に交付を受けた文書）。令和3年から令和5年は会期ごとの手書きの表で、日ごとの人数の合計が表の「計」と傍聴券の通し番号に合うことを確かめています。委員会の傍聴は含みません。このページは議会への参加を考えるための資料で、傍聴者の多い少ないで会期や議員を評価するものではありません。
            <TextLink href={routes.sources()} className="ml-1">
              出典の種類と読み方について
            </TextLink>
          </SourceNote>
        </div>
      </Container>
    </div>
  );
}
