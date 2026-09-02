import { Container } from "@/components/layouts/container";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  MAYOR_PROFILE,
  MAYORAL_ELECTION,
} from "../../../shared/data/mayor-profile";
import {
  calculateAge,
  daysSinceInauguration,
} from "../../../shared/utils/mayor-activity";
import { SourceLink } from "./source-link";

interface HeroSectionProps {
  /** JST基準の現在時刻（就任日数・年齢の計算に使う） */
  now: Date;
}

/** 氏名・就任日・就任N日目・年齢・公式プロフィールへのリンク */
export function HeroSection({ now }: HeroSectionProps) {
  const age = calculateAge(MAYOR_PROFILE.birthDate, now);
  const days = daysSinceInauguration(MAYOR_PROFILE.inaugurationDate, now);

  return (
    <div className="bg-mirai-surface-key md:rounded-lg">
      <Container className="py-8">
        <p className="text-sm font-bold text-primary-accent">田川市長</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight text-mirai-text">
          {MAYOR_PROFILE.name}
          <span className="ml-3 text-base font-medium text-mirai-text-secondary">
            {MAYOR_PROFILE.reading}
          </span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mirai-text-secondary">
          {formatDateWithDots(MAYOR_PROFILE.inaugurationDate)}
          就任（{MAYOR_PROFILE.term}）。{MAYORAL_ELECTION.reason}
          で初当選しました。このページでは、就任後に議会で何が動いたか、
          どんな議案を出したか、そして就任までの経緯を、公開データからたどれるようにまとめています。
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {days > 0 && (
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              就任{days}日目
            </span>
          )}
          <span className="rounded-md bg-white px-3 py-1.5 font-medium text-mirai-text-secondary">
            {age}歳（{formatDateWithDots(MAYOR_PROFILE.birthDate)}生まれ）
          </span>
          <SourceLink
            link={{
              href: MAYOR_PROFILE.officialProfileUrl,
              label: "市の公式プロフィール",
              external: true,
            }}
            className="rounded-md bg-white px-3 py-1.5 font-medium"
          />
        </div>
      </Container>
    </div>
  );
}
