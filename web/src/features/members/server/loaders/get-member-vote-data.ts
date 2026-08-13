import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { DEFAULT_DIFFICULTY } from "@/features/bill-difficulty/shared/types";
import { getBillsLite } from "@/features/bills/server/loaders/get-bills";
import { findPublishedBillProposerSources } from "@/features/bills/server/repositories/bill-repository";
import type { BillWithContentLite } from "@/features/bills/shared/types";
import { parseMemberVotes } from "@/features/bills/shared/utils/member-votes";
import { CACHE_TAGS } from "@/lib/cache-tags";
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
 * getBillsLite()（unstable_cacheでキャッシュ済み）を土台にするため追加の
 * DBアクセスは発生しない。並び順はgetBillsLite()と同じ議決日の新しい順
 */
export async function getBillsWithMemberVotes(): Promise<
  BillWithMemberVotes<BillWithContentLite>[]
> {
  const bills = await getBillsLite();
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
  Array<{ bill: BillWithContentLite; sponsors: BillSponsors }>
> {
  const bills = await getBillsLite();
  return bills.flatMap((bill) => {
    const sponsors = parseBillSponsors(bill.sponsors);
    return sponsors ? [{ bill, sponsors }] : [];
  });
}

/** 議案ID（bills.id）→提出者区分の対応表 */
type ProposerTypeByBillId = Record<string, ProposerType | null>;

/**
 * 全公開済み議案の提出者区分の対応表を取得する。
 *
 * 提出者区分の判定にはbill_contents.content（長文Markdown）の
 * 「**提出者**: 市長提出」行が必要だが、content込みの取得は重いため、
 * 取得はこのキャッシュのmiss時だけに閉じ込め、キャッシュには判定結果
 * （軽量なRecord）だけを保存する。提出者区分は閲覧難易度と無関係のため
 * （本文はnormal難易度でのみ生成される）、難易度でキャッシュを分けない。
 * React cache() でリクエスト内の呼び出しを重複排除する
 */
const getProposerTypeMap = cache(
  (): Promise<ProposerTypeByBillId> => _getCachedProposerTypeMap()
);

const _getCachedProposerTypeMap = unstable_cache(
  async (): Promise<ProposerTypeByBillId> => {
    const data = await findPublishedBillProposerSources(DEFAULT_DIFFICULTY);
    const typeByBillId: ProposerTypeByBillId = {};
    for (const item of data) {
      const content = Array.isArray(item.bill_contents)
        ? item.bill_contents[0]?.content
        : undefined;
      typeByBillId[item.id] = getProposerType({
        name: item.name,
        content: content ?? null,
      });
    }
    return typeByBillId;
  },
  ["bill-proposer-types"],
  {
    // 提出者区分はデータ更新時にしか変わらず、更新時はadmin操作の
    // /api/revalidate（revalidateTag）で即時失効するため、タイマーは長めの保険
    revalidate: 86400,
    tags: [CACHE_TAGS.BILLS],
  }
);

/**
 * 指定した提出者区分（市長/議員/委員会）の公開済み議案を取得する。
 * 並び順はgetBillsLite()と同じ議決日の新しい順
 */
export async function getBillsByProposer(
  proposer: ProposerType
): Promise<BillWithContentLite[]> {
  const [bills, typeByBillId] = await Promise.all([
    getBillsLite(),
    getProposerTypeMap(),
  ]);
  return bills.filter((bill) => typeByBillId[bill.id] === proposer);
}

/**
 * 提出者区分ごとの公開済み議案数を取得する（一覧ページのカード表示用）
 */
export async function countBillsByProposer(): Promise<
  Record<ProposerType, number>
> {
  const typeByBillId = await getProposerTypeMap();
  const counts: Record<ProposerType, number> = {
    mayor: 0,
    member: 0,
    committee: 0,
  };
  for (const type of Object.values(typeByBillId)) {
    if (type) {
      counts[type] += 1;
    }
  }
  return counts;
}
