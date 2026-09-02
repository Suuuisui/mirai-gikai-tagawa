import { SectionHeading } from "@/components/ui/section-heading";
import { MAYOR_PROFILE } from "../../../shared/data/mayor-profile";

/** 公式プロフィールの経歴（転記元の更新日を添える） */
export function CareerSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>経歴</SectionHeading>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {MAYOR_PROFILE.career.map((item) => (
          <li
            key={item}
            className="text-sm leading-relaxed text-mirai-text-secondary"
          >
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs text-mirai-text-note">
        ※ 田川市公式サイトの市長プロフィール（{MAYOR_PROFILE.profileAsOf}
        更新）より
      </p>
    </section>
  );
}
