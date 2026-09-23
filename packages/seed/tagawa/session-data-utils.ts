/**
 * 会期・議案データを CSV に変換する際の純粋なロジック【田川市専用】
 *
 * build-csv.ts / scrape.ts の main() から切り出したもの。ファイルI/Oは持たず、
 * 入力→出力だけを扱うので session-data-utils.test.ts で回帰を守る。
 */

import type { BillDescriptionSource } from "./bill-descriptions";
import type { BillSource, SessionSource } from "./source-data";

/**
 * 公式サイトから取り込んだ会期と、手で管理する会期中の会期を結合する。
 * 同じ key が両方にあるのは「議決結果ページが公開されたのに
 * ongoing-sessions.json から消し忘れた」状態なので、対処法つきで止める
 */
export function mergeSessions(
  scraped: readonly SessionSource[],
  ongoing: readonly SessionSource[]
): SessionSource[] {
  const scrapedKeys = new Set(scraped.map((s) => s.key));
  for (const session of ongoing) {
    if (scrapedKeys.has(session.key)) {
      throw new Error(
        `会期 ${session.key} は sessions.json に取り込み済みです。data/ongoing-sessions.json から削除してください`
      );
    }
  }
  return [...scraped, ...ongoing];
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

const RESULT_SOURCE_BULLET: Partial<Record<ResultSource, string>> = {
  minutes:
    "- 議決結果は[田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録から自動抽出したものです",
  broadcast:
    "- 議決結果は公式YouTubeチャンネルの本会議中継映像で確認したものです（議決結果ページの公開後に照合します）",
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

const EXPLANATION_MATERIALS_BULLET =
  "- 田川市議会公式サイトに掲載の議案説明資料（PDF）等の公開情報";

/** 解説文の典拠ごとの「## 出典」の箇条書きと末尾の注記 */
const DESCRIPTION_SOURCE_CITATIONS: Record<
  BillDescriptionSource,
  { bullets: string[]; note: string }
> = {
  minutes: {
    bullets: [
      "- [田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録（提案理由説明・委員会審査結果報告・質疑・討論等）",
    ],
    note: "※ 上記の解説は、田川市議会 会議録検索システムで公開されている本会議録（提案理由説明・委員会審査結果報告・質疑・討論の内容）をもとに作成しています。",
  },
  "explanation-materials": {
    bullets: [EXPLANATION_MATERIALS_BULLET],
    note: "※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等の情報をもとに作成しています。本会議での質疑・討論の内容は、会議録が本稿執筆時点（2026年7月）で田川市議会 会議録検索システムに未公開のため反映していません。",
  },
  broadcast: {
    bullets: [
      EXPLANATION_MATERIALS_BULLET,
      "- [田川市議会 公式YouTubeチャンネル](https://www.joho.tagawa.fukuoka.jp/kiji0037830/index.html)の本会議中継映像（提案理由説明・質疑・討論・採決）",
    ],
    note: "※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等と、公式YouTubeチャンネルの本会議中継映像（自動字幕）をもとに作成しています。本会議録は本稿執筆時点（2026年9月）で田川市議会 会議録検索システムに未公開のため、発言の細部は中継映像でご確認ください。",
  },
};

const NOTE_FACTS_ONLY =
  "※ この内容は田川市議会事務局が公開する情報を基に事実のみを転記したものです。分かりやすい解説文のAIによる生成は行っていません。";

export interface SourceSectionInput {
  sessionName: string;
  sourceUrl: string;
  /** 会期中の会期は公式ページの題名が「提出議案」（議決結果ページはまだ無い） */
  isOngoing: boolean;
  /** 解説文の典拠。解説が無い議案は null */
  descriptionSource: BillDescriptionSource | null;
  resultSource: BillSource["resultSource"];
}

/** bill_contents.content 末尾の「## 出典」セクション（見出しから注記まで） */
export function buildSourceSection(input: SourceSectionInput): string[] {
  const pageTitle = input.isOngoing ? "提出議案" : "提出議案と議決結果";
  const citations = input.descriptionSource
    ? DESCRIPTION_SOURCE_CITATIONS[input.descriptionSource]
    : null;
  const resultBullet = input.resultSource
    ? RESULT_SOURCE_BULLET[input.resultSource]
    : undefined;
  return [
    "## 出典",
    "",
    `- [田川市議会「${input.sessionName}の${pageTitle}」](${input.sourceUrl})（福岡県田川市公式サイト）`,
    ...(citations?.bullets ?? []),
    ...(resultBullet ? [resultBullet] : []),
    "",
    citations?.note ?? NOTE_FACTS_ONLY,
  ];
}
