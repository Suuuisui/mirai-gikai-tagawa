import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import { routes } from "@/lib/routes";
import { groupBillsByEraYear } from "../../shared/utils/group-bills-by-era-year";
import {
  PROPOSER_DESCRIPTIONS,
  PROPOSER_LABELS,
  type ProposerType,
} from "../../shared/utils/proposer";
import { getBillsByProposer } from "../loaders/get-member-vote-data";

interface ProposerBillsPageProps {
  proposer: ProposerType;
}

/**
 * 提出者区分（市長/議員/委員会）別の議案一覧ページ
 */
export async function ProposerBillsPage({ proposer }: ProposerBillsPageProps) {
  const bills = await getBillsByProposer(proposer);
  const label = PROPOSER_LABELS[proposer];
  const eraYearGroups = groupBillsByEraYear(bills);

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-1.5 pb-8">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            {label}の議案一覧
          </h1>
          <p className="text-xs text-mirai-text-secondary">
            {PROPOSER_DESCRIPTIONS[proposer]}
          </p>
          <p className="text-xs text-mirai-text-secondary">
            {bills.length}件（議決日の新しい順）
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {eraYearGroups.map((group) => (
            <section key={group.label} className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-mirai-text">
                {group.label}
              </h2>
              <div className="flex flex-col gap-3">
                {group.bills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={routes.billDetail(bill.id) as Route}
                  >
                    <CompactBillCard bill={bill} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            {
              label: "議員・提出者から見る",
              href: routes.memberArchive(),
            },
            { label },
          ]}
        />
      </Container>
    </div>
  );
}
