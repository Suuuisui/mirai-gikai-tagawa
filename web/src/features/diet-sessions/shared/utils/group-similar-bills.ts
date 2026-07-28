import type { BillWithContent } from "@/features/bills/shared/types";

/** この件数以上、同型の議案が連続したらグループに集約する */
export const GROUP_MIN_COUNT = 3;

/** 議案リストの1項目。単独議案か、同型議案のグループのいずれか */
export type BillListItem =
  | { type: "single"; bill: BillWithContent }
  | {
      type: "group";
      /** 括弧書き（対象者名等）を除いた共通の件名 */
      baseTitle: string;
      bills: BillWithContent[];
    };

/**
 * 表示タイトルから末尾の括弧書き（「（野中 栄藏 氏）」等）を除いた
 * ベース件名を返す。括弧書きが無ければそのまま返す
 */
export function getBaseTitle(title: string): string {
  return title.replace(/（[^（）]*）\s*$/u, "").trim();
}

function getDisplayTitle(bill: BillWithContent): string {
  return bill.bill_content?.title || bill.name;
}

/**
 * 議案リスト内で「同じ件名＋括弧書きだけが違う」議案（農業委員会委員の
 * 任命など、対象者ごとに1件ずつ提出される人事案件）が連続する場合に
 * 1つのグループへ集約する純粋関数。
 *
 * 会期まとめの全議案リストで同型カードが十数枚連続するのを防ぎ、
 * 賛否が分かれた議案などの重要案件が埋もれないようにする。
 * 連続していない同名議案はグループにしない（リストの並び順を保つため）
 */
export function groupSimilarBills(bills: BillWithContent[]): BillListItem[] {
  const items: BillListItem[] = [];
  let index = 0;

  while (index < bills.length) {
    const base = getBaseTitle(getDisplayTitle(bills[index]));

    // 同じベース件名が続く範囲を数える（括弧書きが無い議案は集約しない）
    let end = index;
    while (
      end < bills.length &&
      getBaseTitle(getDisplayTitle(bills[end])) === base &&
      getDisplayTitle(bills[end]) !== base
    ) {
      end++;
    }

    const runLength = end - index;
    if (runLength >= GROUP_MIN_COUNT) {
      items.push({
        type: "group",
        baseTitle: base,
        bills: bills.slice(index, end),
      });
      index = end;
    } else {
      items.push({ type: "single", bill: bills[index] });
      index++;
    }
  }

  return items;
}
