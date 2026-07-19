import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  countVotes,
  parseMemberVotes,
} from "@/features/bills/shared/utils/member-votes";
import { routes } from "@/lib/routes";

interface SplitVoteSectionProps {
  bills: BillWithContent[];
}

type SplitVoteBill = {
  bill: BillWithContent;
  yes: number;
  no: number;
};

function toSplitVoteBill(bill: BillWithContent): SplitVoteBill | null {
  const memberVotes = parseMemberVotes(bill.member_votes);
  if (memberVotes === null) {
    return null;
  }
  const { yes, no } = countVotes(memberVotes.entries);
  return { bill, yes, no };
}

/**
 * 「賛否が分かれた案件」セクション。田川市議会が議員別の賛否を公開している
 * 議案（member_votesが有効な議案）を、賛成/反対の比率バー付きで一覧表示する。
 * ハイライトセクションと対象議案が重複してもよい（役割が異なるため）
 */
export function SplitVoteSection({ bills }: SplitVoteSectionProps) {
  const splitVoteBills = bills
    .map(toSplitVoteBill)
    .filter((item): item is SplitVoteBill => item !== null);

  if (splitVoteBills.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
        🗳️ 賛否が分かれた案件
      </h2>
      <div className="flex flex-col gap-3">
        {splitVoteBills.map(({ bill, yes, no }) => {
          const title = bill.bill_content?.title || bill.name;
          return (
            <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
              <Card className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.6]">
                  {title}
                </h3>
                {/* 比率バー（幅は票数比によるレイアウト計算のため style を使用。
                    色指定はクラスで行っておりインラインカラーコードではない） */}
                <div
                  className="flex h-2 w-full overflow-hidden rounded-full bg-mirai-surface-muted"
                  role="img"
                  aria-label={`賛成${yes}対反対${no}`}
                >
                  <div
                    className="basis-0 bg-vote-for"
                    style={{ flexGrow: yes }}
                  />
                  <div
                    className="basis-0 bg-stance-against"
                    style={{ flexGrow: no }}
                  />
                </div>
                <p className="text-xs text-mirai-text-muted">
                  賛成{yes}・反対{no}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
