import "server-only";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import type { BillWithContent } from "@/features/bills/shared/types";
import { parseMemberVotes } from "@/features/bills/shared/utils/member-votes";
import type { BillWithMemberVotes } from "../../shared/utils/aggregate-members";
import {
  getProposerType,
  type ProposerType,
} from "../../shared/utils/proposer";
import {
  type BillSponsors,
  parseBillSponsors,
} from "../../shared/utils/sponsors";

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
 * 議員別賛否データ（member_votes）に登場する議員名（姓）の集合を取得する。
 * 議案の提出者・賛成者チップを議員個人ページへリンクさせるかどうかの
 * 判定（歴代議員等、名簿に無い人物はリンクしない）に使う
 */
export async function getMemberNameSet(): Promise<Set<string>> {
  const items = await getBillsWithMemberVotes();
  const names = new Set<string>();
  for (const { memberVotes } of items) {
    for (const entry of memberVotes.entries) {
      names.add(entry.name);
    }
  }
  return names;
}

/**
 * 提出者・賛成者データ（sponsors）が紐づく公開済み議案を取得する。
 * 議員提出・委員会提出議案のみデータが入り、市長提出等はnullのため
 * parseできる議案のみ返す
 */
export async function getBillsWithSponsors(): Promise<
  Array<{ bill: BillWithContent; sponsors: BillSponsors }>
> {
  const bills = await getBills();
  return bills.flatMap((bill) => {
    const sponsors = parseBillSponsors(bill.sponsors);
    return sponsors ? [{ bill, sponsors }] : [];
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
