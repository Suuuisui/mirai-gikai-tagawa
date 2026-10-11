/**
 * 会期・議案データを CSV に変換する際の純粋なロジック【田川市専用】
 *
 * build-csv.ts / scrape.ts の main() から切り出したもの。ファイルI/Oは持たず、
 * 入力→出力だけを扱うので session-data-utils.test.ts で回帰を守る。
 */

import type { BillSource, Proposer, SessionSource } from "./source-data";

/** 公式ページの番号表記を、サイトで先に公開していた表記に読み替える対応 */
export interface BillLabelAlias {
  sessionKey: string;
  proposer: Proposer;
  /** 公式ページから読み取った表記（例: 議案第62号） */
  officialLabel: string;
  /** サイトで使い続ける表記（例: 議員提出議案第62号） */
  label: string;
}

/**
 * 番号表記から提出者の語を除いたもの（「議員提出議案第62号」→「議案第62号」）。
 * 公式ページは議員提出議案を「議員提出 議案第62号」と2行に分けて書くことがあり、
 * 読み取ると「議案第62号」になる
 */
export function billNumberCore(label: string): string {
  return label.replace(/^(議員提出|委員会提出)/, "");
}

const TRAILING_PARENTHETICAL = /[（(][^（()）]*[）)]$/;

/**
 * 番号の無い議案どうしの件名が同じか。空白の違いと、片方にだけ付いた末尾の括弧書き
 * （「〜について（案）」）は無視する。両方に括弧書きがあるときは中身まで比べる
 * （「〜の選任について（甲氏）」と「〜の選任について（乙氏）」は別の議案）
 */
function titlesMatch(a: string, b: string): boolean {
  const normalize = (title: string) =>
    title.normalize("NFKC").replace(/\s+/g, "");
  const [left, right] = [normalize(a), normalize(b)];
  if (left === right) return true;
  const leftHasNote = TRAILING_PARENTHETICAL.test(left);
  const rightHasNote = TRAILING_PARENTHETICAL.test(right);
  if (leftHasNote === rightHasNote) return false;
  return (
    left.replace(TRAILING_PARENTHETICAL, "") ===
    right.replace(TRAILING_PARENTHETICAL, "")
  );
}

/** 会期中に手で置いた議案と、公式ページから読み取った議案が同じ議案か */
function isSameBill(ongoing: BillSource, scraped: BillSource): boolean {
  if (ongoing.proposer !== scraped.proposer) return false;
  if (ongoing.billNumberLabel !== null && scraped.billNumberLabel !== null) {
    return (
      billNumberCore(ongoing.billNumberLabel) ===
      billNumberCore(scraped.billNumberLabel)
    );
  }
  return (
    ongoing.billNumberLabel === scraped.billNumberLabel &&
    titlesMatch(ongoing.title, scraped.title)
  );
}

/** 会期データに番号表記の読み替えを当てる（当てはまらない議案はそのまま） */
export function applyBillLabelAliases(
  sessions: readonly SessionSource[],
  aliases: readonly BillLabelAlias[]
): SessionSource[] {
  if (aliases.length === 0) return [...sessions];
  return sessions.map((session) => {
    const forSession = aliases.filter((a) => a.sessionKey === session.key);
    if (forSession.length === 0) return session;
    return {
      ...session,
      bills: session.bills.map((bill) => {
        const alias = forSession.find(
          (a) =>
            a.proposer === bill.proposer &&
            a.officialLabel === bill.billNumberLabel
        );
        return alias ? { ...bill, billNumberLabel: alias.label } : bill;
      }),
    };
  });
}

/**
 * 会期中に手で置いた議案と公式ページの議案で、提出者と番号は同じなのに表記だけが
 * 違うものを探す。議案の id（＝URL）は番号表記から決まるので、表記が変わると
 * 同じ議案が別の id で二重に公開され、解説も外れる。先に公開していた表記（会期中の方）を
 * 使い続けるための読み替えを返す
 */
export function findBillLabelAliases(
  ongoing: readonly SessionSource[],
  scraped: readonly SessionSource[]
): BillLabelAlias[] {
  const scrapedByKey = new Map(scraped.map((s) => [s.key, s]));
  return ongoing.flatMap((session) => {
    const official = scrapedByKey.get(session.key);
    if (!official) return [];
    return session.bills.flatMap((bill) => {
      if (bill.billNumberLabel === null) return [];
      const counterpart = official.bills.find(
        (b) =>
          isSameBill(bill, b) && b.billNumberLabel !== bill.billNumberLabel
      );
      return counterpart?.billNumberLabel
        ? [
            {
              sessionKey: session.key,
              proposer: bill.proposer,
              officialLabel: counterpart.billNumberLabel,
              label: bill.billNumberLabel,
            },
          ]
        : [];
    });
  });
}

/**
 * 会期中の一覧から、公式の議決結果ページに載った議案を外す。
 * 公式ページは会期の途中（最終日より前）に公開されることがあり、その時点では
 * 最終日に議決される議案（決算の認定や追加議案）がまだ載っていない。
 * 載っていない議案は会期中の一覧に残し、すべて載ったら会期ごと外す
 */
export function pruneOngoingSessions(
  ongoing: readonly SessionSource[],
  scraped: readonly SessionSource[]
): {
  /** 会期中の一覧に残すもの（公式ページに無い会期と、一部の議案がまだ載っていない会期） */
  kept: SessionSource[];
  /** すべての議案が公式ページに載り、会期中の一覧から外れた会期 */
  pruned: SessionSource[];
  /** 公式ページに載ったが、まだ載っていない議案が残っている会期（残した議案だけを持つ） */
  partial: SessionSource[];
} {
  const scrapedByKey = new Map(scraped.map((s) => [s.key, s]));
  const kept: SessionSource[] = [];
  const pruned: SessionSource[] = [];
  const partial: SessionSource[] = [];
  for (const session of ongoing) {
    const official = scrapedByKey.get(session.key);
    if (!official) {
      kept.push(session);
      continue;
    }
    const remaining = session.bills.filter(
      (bill) => !official.bills.some((b) => isSameBill(bill, b))
    );
    if (remaining.length === 0) {
      pruned.push(session);
    } else {
      const leftover = { ...session, bills: remaining };
      kept.push(leftover);
      partial.push(leftover);
    }
  }
  return { kept, pruned, partial };
}

/** 会期データを合わせた後の議案。公式ページに未掲載の議案は出典ページを別に持つ */
export interface MergedBill extends BillSource {
  /**
   * 会期中として手で置いた議案（公式の議決結果ページにまだ載っていない）の出典ページ。
   * 会期中の「提出議案」ページのURL。公式ページから取り込んだ議案には無い
   */
  ongoingSourceUrl?: string;
}

export interface MergedSession extends Omit<SessionSource, "bills"> {
  bills: MergedBill[];
}

/**
 * 公式サイトから取り込んだ会期と、手で管理する会期中の会期を合わせる。
 * 同じ会期が両方にあるとき（公式ページが会期の途中で公開されたとき）は、
 * 公式ページの議案の後ろに、まだ載っていない議案を足す。
 * 同じ議案が両方にあるのは「公式ページに載ったのに ongoing-sessions.json から
 * 消し忘れた」状態なので、対処法つきで止める（tagawa:scrape が自動で外す）
 */
export function mergeSessions(
  scraped: readonly SessionSource[],
  ongoing: readonly SessionSource[]
): MergedSession[] {
  const ongoingByKey = new Map(ongoing.map((s) => [s.key, s]));
  const asOngoingBills = (session: SessionSource): MergedBill[] =>
    session.bills.map((bill) => ({
      ...bill,
      ongoingSourceUrl: session.sourceUrl,
    }));

  const merged: MergedSession[] = scraped.map((session) => {
    const extra = ongoingByKey.get(session.key);
    if (!extra) return session;
    for (const bill of extra.bills) {
      if (session.bills.some((b) => isSameBill(bill, b))) {
        throw new Error(
          `会期 ${session.key} の ${bill.billNumberLabel ?? bill.title} は sessions.json に取り込み済みです。data/ongoing-sessions.json から削除してください（tagawa:scrape を実行すると自動で外れます）`
        );
      }
    }
    return { ...session, bills: [...session.bills, ...asOngoingBills(extra)] };
  });

  const scrapedKeys = new Set(scraped.map((s) => s.key));
  const ongoingOnly: MergedSession[] = ongoing
    .filter((session) => !scrapedKeys.has(session.key))
    .map((session) => ({ ...session, bills: asOngoingBills(session) }));
  return [...merged, ...ongoingOnly];
}

/**
 * 会期一覧で「直近の田川市議会」として強調する会期の key。
 * 開会日が最新の会期を選ぶ（会期中の会期があれば自然にそれになる）。
 * 開会日が同じときは入力で先にある方
 */
export function pickActiveSessionKey(
  sessions: readonly SessionSource[]
): string | undefined {
  let active: SessionSource | undefined;
  for (const session of sessions) {
    if (!active || session.startDate > active.startDate) {
      active = session;
    }
  }
  return active?.key;
}

/**
 * 公式サイトの一覧ページには直近の会期しか載らず、古い会期はページの掲載期間が
 * 過ぎると一覧から外れる。今回取り込めなかった会期は前回の出力から引き継ぐ
 */
export function carryOverMissingSessions(
  scraped: readonly SessionSource[],
  previous: readonly SessionSource[]
): { sessions: SessionSource[]; carried: SessionSource[] } {
  const scrapedKeys = new Set(scraped.map((s) => s.key));
  const carried = previous.filter((s) => !scrapedKeys.has(s.key));
  return { sessions: [...scraped, ...carried], carried };
}

type ResultSource = NonNullable<BillSource["resultSource"]>;

/**
 * 議決結果の出典が公式ページ以外のときに status_note に添える語。
 * 添えると web 側 vote-disclosure.ts の「全会一致」判定（結果の文言の完全一致）から
 * 外れ、賛否は表示されなくなる（会議録や中継映像から拾った結果は保守的に扱う）
 */
const RESULT_SOURCE_SUFFIX: Partial<Record<ResultSource, string>> = {
  minutes: "（本会議会議録より自動抽出）",
  broadcast: "（本会議の中継映像より）",
};

export const NO_RESULT_NOTE = "議決結果不明（出典に記載なし）";

/** bills.name（「議案第50号　件名」。番号が無い案件は件名だけ） */
export function buildBillName(billNumberLabel: string | null, title: string): string {
  return billNumberLabel ? `${billNumberLabel}　${title}` : title;
}

/** bills.status_note。結果が無い議案は statusNote（審議中〜）を使う */
export function buildStatusNote(
  bill: Pick<BillSource, "resultLabel" | "resultSource" | "statusNote">
): string {
  if (bill.resultLabel === null) {
    return bill.statusNote ?? NO_RESULT_NOTE;
  }
  return `${bill.resultLabel}${RESULT_SOURCE_SUFFIX[bill.resultSource ?? "official"] ?? ""}`;
}

/** 解説文が無い議案の一覧・OGP用サマリー */
export function buildDefaultSummary(
  sessionName: string,
  proposerLabel: string,
  bill: Pick<BillSource, "resultLabel" | "statusNote" | "resolvedDate">
): string {
  if (bill.resultLabel) {
    return `${sessionName}に${proposerLabel}から提出され、${bill.resultLabel}となりました。（議決日: ${bill.resolvedDate}）`;
  }
  if (bill.statusNote) {
    return `${sessionName}に${proposerLabel}から提出され、${bill.statusNote}です。`;
  }
  return `${sessionName}に${proposerLabel}から提出されました。議決結果は出典ページに記載されていません。`;
}
