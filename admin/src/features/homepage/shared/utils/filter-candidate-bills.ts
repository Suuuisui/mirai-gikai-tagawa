import type { CurationBill } from "../types";

export type CandidateBillFilter = {
  /** 議案名・タイトル・タグ名・会期名の部分一致（省略・空白のみなら条件なし） */
  keyword?: string;
  /** 会期ID（null なら全会期） */
  sessionId: string | null;
};

/**
 * 「注目の議案」の追加候補やタグ枠の固定候補を絞り込む純粋関数。
 * 最新の会期の議案は議決前で争点が無く興味度スコアが低いため、スコア順の
 * 一覧では下のほうに埋もれる。会期での絞り込みと会期名での検索を効かせて、
 * 「今の会期の議案をトップに出したい」ときにすぐ見つかるようにする
 */
export function filterCandidateBills(
  bills: readonly CurationBill[],
  filter: CandidateBillFilter
): CurationBill[] {
  const keyword = normalizeForSearch(filter.keyword ?? "").trim();
  return bills.filter((bill) => {
    if (filter.sessionId !== null && bill.sessionId !== filter.sessionId) {
      return false;
    }
    return keyword === "" || matchesKeyword(bill, keyword);
  });
}

/**
 * 表示する候補と、上限で隠れた件数を返す。
 * 上限は全会期を対象にしたときだけ掛ける（600件超を一度に描画しないため）。
 * 会期で絞り込んだときは1会期分（多くても数十件）なので全件を出す
 */
export function limitCandidateBills(
  bills: readonly CurationBill[],
  sessionId: string | null,
  limit: number
): { visible: CurationBill[]; hiddenCount: number } {
  const visible = sessionId === null ? bills.slice(0, limit) : [...bills];
  return { visible, hiddenCount: bills.length - visible.length };
}

/**
 * 全角の英数字・記号を半角に寄せ、大文字小文字の違いも無視する。
 * 議案名は「令和８年度」のように全角数字、会期名は「令和8年（第6回）」のように
 * 半角数字＋全角括弧が混在しており、どちらで打っても一致させたい
 */
function normalizeForSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

function matchesKeyword(bill: CurationBill, keyword: string): boolean {
  const searchableTexts = [
    bill.name,
    bill.title ?? "",
    bill.sessionName ?? "",
    ...bill.tags.map((tag) => tag.label),
  ];
  return searchableTexts.some((text) =>
    normalizeForSearch(text).includes(keyword)
  );
}
