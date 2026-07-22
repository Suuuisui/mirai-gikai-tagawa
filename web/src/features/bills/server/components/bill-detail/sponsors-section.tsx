import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import {
  extractFamilyName,
  parseBillSponsors,
  type SponsorPerson,
} from "@/features/members/shared/utils/sponsors";
import { routes } from "@/lib/routes";
import type { Bill } from "../../../shared/types";

interface SponsorsSectionProps {
  bill: Bill;
  /** 議員名簿（議員別賛否データに登場する姓の集合）。歴代議員等、名簿に
   * 無い人物はチップをリンクにしない */
  memberNameSet: Set<string>;
}

const CHIP_CLASS =
  "inline-flex items-center rounded-full bg-mirai-surface-muted px-2.5 py-1 text-xs font-medium text-mirai-text";

function SponsorChip({
  person,
  memberNameSet,
}: {
  person: SponsorPerson;
  memberNameSet: Set<string>;
}) {
  const label = person.title ? `${person.title} ${person.name}` : person.name;
  const familyName = extractFamilyName(person.name);

  if (memberNameSet.has(familyName)) {
    return (
      <Link
        href={routes.memberDetail(familyName) as Route}
        className={`${CHIP_CLASS} underline decoration-dotted underline-offset-[3px] transition-opacity hover:opacity-70`}
      >
        {label}
      </Link>
    );
  }
  return <span className={CHIP_CLASS}>{label}</span>;
}

/**
 * 提出者・賛成者（連署議員）セクション
 *
 * 田川市公式サイトが公開している議案説明資料PDFに記載された提出者・
 * 賛成者を一覧表示する。議員提出・委員会提出議案のみデータがあり、
 * データが無い議案（市長提出等）では何も表示しない
 */
export function SponsorsSection({ bill, memberNameSet }: SponsorsSectionProps) {
  const sponsors = parseBillSponsors(bill.sponsors);
  if (sponsors === null) {
    return null;
  }

  const { proposers, supporters, sourceUrl } = sponsors;

  return (
    <section className="my-8 rounded-md bg-white px-4 py-6">
      <h3 className="text-sm font-bold text-black">提出者・賛成者</h3>

      <div className="mt-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-mirai-text-secondary">
            提出者
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {proposers.map((person) => (
              <SponsorChip
                key={person.name}
                person={person}
                memberNameSet={memberNameSet}
              />
            ))}
          </div>
        </div>

        {supporters.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-mirai-text-secondary">
              賛成者
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {supporters.map((person) => (
                <SponsorChip
                  key={person.name}
                  person={person}
                  memberNameSet={memberNameSet}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-[3px] hover:opacity-70"
      >
        出典: 議案説明資料PDF（田川市公式サイト）
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      <p className="mt-2 text-xs text-mirai-text-note">
        ※田川市公式サイト掲載の議案説明資料PDFに記載された提出者・賛成者（連署議員）です
      </p>
    </section>
  );
}
