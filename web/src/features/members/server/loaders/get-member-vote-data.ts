import "server-only";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import type { BillWithContent } from "@/features/bills/shared/types";
import { parseMemberVotes } from "@/features/bills/shared/utils/member-votes";
import type { BillWithMemberVotes } from "../../shared/utils/aggregate-members";
import {
  getProposerType,
  type ProposerType,
} from "../../shared/utils/proposer";

/**
 * 議員別賛否データ（member_votes）が紐づく公開済み議案を取得する。
 * getBills()（unstable_cacheでキャッシュ済み）を土台にするため追加のDBアクセスは
 * 発生しない。並び順はgetBills()と同じ議決日の新しい順
 */
export async function getBillsWithMemberVotes(): Promise<
  BillWithMemberVotes<BillWithContent>[]
> {
  const bills = await getBills();
  return bills.flatMap((bill) => {
    const memberVotes = parseMemberVotes(bill.member_votes);
    return memberVotes ? [{ bill, memberVotes }] : [];
  });
}

/**
 * 指定した提出者区分（市長/議員/委員会）の公開済み議案を取得する。
 * 並び順はgetBills()と同じ議決日の新しい順
 */
export async function getBillsByProposer(
  proposer: ProposerType
): Promise<BillWithContent[]> {
  const bills = await getBills();
  return bills.filter(
    (bill) =>
      getProposerType({
        name: bill.name,
        content: bill.bill_content?.content ?? null,
      }) === proposer
  );
}

/**
 * 提出者区分ごとの公開済み議案数を取得する（一覧ページのカード表示用）
 */
export async function countBillsByProposer(): Promise<
  Record<ProposerType, number>
> {
  const bills = await getBills();
  const counts: Record<ProposerType, number> = {
    mayor: 0,
    member: 0,
    committee: 0,
  };
  for (const bill of bills) {
    const type = getProposerType({
      name: bill.name,
      content: bill.bill_content?.content ?? null,
    });
    if (type) {
      counts[type] += 1;
    }
  }
  return counts;
}
