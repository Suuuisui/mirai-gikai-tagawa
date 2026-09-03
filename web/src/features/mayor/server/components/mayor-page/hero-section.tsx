import { Container } from "@/components/layouts/container";
import { JumpNav } from "@/components/ui/jump-nav";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  MAYOR_PROFILE,
  MAYORAL_ELECTION,
} from "../../../shared/data/mayor-profile";
import {
  calculateAge,
  daysSinceInauguration,
} from "../../../shared/utils/mayor-activity";
import { MAYOR_SECTIONS } from "./section-ids";
import { SourceLink } from "./source-link";

const JUMP_ENTRIES = Object.values(MAYOR_SECTIONS).map((section) => ({
  label: section.navLabel,
  href: `#${section.id}`,
}));

interface HeroSectionProps {
  /** JST基準の現在時刻（就任日数・年齢の計算に使う） */
  now: Date;
}

/** 氏名・就任日・就任N日目・年齢・公式プロフィールへのリンクと、ページ内ジャンプナビ */
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
        <p className="mt-2 text-sm font-medium text-mirai-text-secondary">
          {formatDateWithDots(MAYOR_PROFILE.inaugurationDate)}就任・
          {MAYOR_PROFILE.term}・{age}歳
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mirai-text-secondary">
          {MAYORAL_ELECTION.reason}
          で初当選しました。就任後に何をしたか、これから何があるか、
          なぜ市長が交代したのかを、議会の記録からたどれます。
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {days > 0 && (
            <span className="rounded-md bg-white px-3 py-1.5 font-bold text-mirai-text">
              就任{days}日目
            </span>
          )}
          <SourceLink
            link={{
              href: MAYOR_PROFILE.officialProfileUrl,
              label: "市の公式プロフィール",
              external: true,
            }}
            className="rounded-md bg-white px-3 py-1.5 font-medium"
          />
        </div>
        <JumpNav entries={JUMP_ENTRIES} className="mt-5" />
      </Container>
    </div>
  );
}
