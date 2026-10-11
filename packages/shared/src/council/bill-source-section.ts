/**
 * 議案の本文（bill_contents.content）の末尾に付ける「## 出典」と、その読み取り【田川市専用】
 *
 * 出典の書き出し（seed の build-csv.ts）と、画面に出す出典バッジのための読み取り
 * （web の議案詳細）が同じ文言を前提にするため、両方をここに置く。
 * 文言を変えるときは、本番DBの本文が作り直されるまで古い文言も読めるように
 * parseBillSources 側を先に対応させること
 */

import { OFFICIAL_MINUTES_SYSTEM_NAME, OFFICIAL_MINUTES_TOP_URL } from "./official-minutes";

/** 解説文が何をもとに書かれたか */
export type BillDescriptionSource =
  /** 会議録検索システムの本会議録（提案理由説明・質疑・討論等）に基づく */
  | "minutes"
  /** 議案説明資料（PDF）等、会議録以外の公開資料に基づく（会議録が未公開のとき） */
  | "explanation-materials"
  /** 議案説明資料（PDF）と、公式YouTubeの本会議中継映像（自動字幕）に基づく */
  | "broadcast";

/**
 * 議決結果が何で確認されたか。
 * official: 市公式サイトの議決結果ページ / minutes: 会議録検索システムの本会議録 /
 * broadcast: 公式YouTubeの本会議中継映像（議決結果ページが公開される前の会期）
 */
export type BillResultSource = "official" | "minutes" | "broadcast";

const MINUTES_LINK = `[${OFFICIAL_MINUTES_SYSTEM_NAME}](${OFFICIAL_MINUTES_TOP_URL})`;

const BROADCAST_CHANNEL_LINK =
  "[田川市議会 公式YouTubeチャンネル](https://www.joho.tagawa.fukuoka.jp/kiji0037830/index.html)";

const EXPLANATION_MATERIALS_BULLET =
  "- 田川市議会公式サイトに掲載の議案説明資料（PDF）等の公開情報";

const MINUTES_DESCRIPTION_BULLET = `- ${MINUTES_LINK}の本会議録（提案理由説明・委員会審査結果報告・質疑・討論等）`;

const BROADCAST_DESCRIPTION_BULLET = `- ${BROADCAST_CHANNEL_LINK}の本会議中継映像（提案理由説明・質疑・討論・採決）`;

const RESULT_SOURCE_BULLET: Record<
  Exclude<BillResultSource, "official">,
  string
> = {
  minutes: `- 議決結果は${MINUTES_LINK}の本会議録から自動抽出したものです`,
  broadcast:
    "- 議決結果は公式YouTubeチャンネルの本会議中継映像で確認したものです（議決結果ページの公開後に照合します）",
};

/** 解説文の典拠ごとの箇条書きと末尾の注記 */
const DESCRIPTION_SOURCE_CITATIONS: Record<
  BillDescriptionSource,
  { bullets: string[]; note: string }
> = {
  minutes: {
    bullets: [MINUTES_DESCRIPTION_BULLET],
    note: "※ 上記の解説は、田川市議会 会議録検索システムで公開されている本会議録（提案理由説明・委員会審査結果報告・質疑・討論の内容）をもとに作成しています。",
  },
  "explanation-materials": {
    bullets: [EXPLANATION_MATERIALS_BULLET],
    note: "※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等の情報をもとに作成しています。本会議での質疑・討論の内容は、会議録が本稿執筆時点（2026年7月）で田川市議会 会議録検索システムに未公開のため反映していません。",
  },
  broadcast: {
    bullets: [EXPLANATION_MATERIALS_BULLET, BROADCAST_DESCRIPTION_BULLET],
    note: "※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等と、公式YouTubeチャンネルの本会議中継映像（自動字幕）をもとに作成しています。本会議録は本稿執筆時点（2026年9月）で田川市議会 会議録検索システムに未公開のため、発言の細部は中継映像でご確認ください。",
  },
};

const NOTE_FACTS_ONLY =
  "※ この内容は田川市議会事務局が公開する情報を基に事実のみを転記したものです。分かりやすい解説文のAIによる生成は行っていません。";

const SOURCE_HEADING = "## 出典";

export interface BillSourceSectionInput {
  sessionName: string;
  /** 市公式サイトの「提出議案と議決結果」ページ */
  sourceUrl: string;
  /** 会期中の会期は公式ページの題名が「提出議案」（議決結果ページはまだ無い） */
  isOngoing: boolean;
  /** 解説文の典拠。解説が無い議案は null */
  descriptionSource: BillDescriptionSource | null;
  /** 議決結果の出典。省略時は公式の議決結果ページ */
  resultSource?: BillResultSource;
}

/** bill_contents.content 末尾の「## 出典」セクション（見出しから注記まで） */
export function buildBillSourceSection(
  input: BillSourceSectionInput
): string[] {
  const pageTitle = input.isOngoing ? "提出議案" : "提出議案と議決結果";
  const citations = input.descriptionSource
    ? DESCRIPTION_SOURCE_CITATIONS[input.descriptionSource]
    : null;
  const resultBullet =
    input.resultSource && input.resultSource !== "official"
      ? RESULT_SOURCE_BULLET[input.resultSource]
      : undefined;
  return [
    SOURCE_HEADING,
    "",
    `- [田川市議会「${input.sessionName}の${pageTitle}」](${input.sourceUrl})（福岡県田川市公式サイト）`,
    ...(citations?.bullets ?? []),
    ...(resultBullet ? [resultBullet] : []),
    "",
    citations?.note ?? NOTE_FACTS_ONLY,
  ];
}

/** 本文の「## 出典」から読み取れた出典 */
export interface ParsedBillSources {
  /** 市公式サイトの議案ページ（「提出議案と議決結果」または会期中の「提出議案」） */
  officialPage: { url: string; isOngoing: boolean } | null;
  /** 解説文の典拠。解説が無い（事実の転記だけの）議案は null */
  descriptionSource: BillDescriptionSource | null;
  resultSource: BillResultSource;
}

/**
 * 議案の本文から出典を読み取る。「## 出典」が無い本文（管理画面で手で書いた議案など）は null。
 * buildBillSourceSection が書き出す箇条書きの文言そのものを目印にする
 */
export function parseBillSources(
  content: string | null | undefined
): ParsedBillSources | null {
  if (!content) return null;
  const headingIndex = content.lastIndexOf(`${SOURCE_HEADING}\n`);
  if (headingIndex === -1) return null;
  const section = content.slice(headingIndex);

  const pageMatch =
    /- \[田川市議会「[^」]*の(提出議案と議決結果|提出議案)」\]\(([^)]+)\)/.exec(
      section
    );

  let descriptionSource: BillDescriptionSource | null = null;
  if (section.includes(MINUTES_DESCRIPTION_BULLET)) {
    descriptionSource = "minutes";
  } else if (section.includes(BROADCAST_DESCRIPTION_BULLET)) {
    descriptionSource = "broadcast";
  } else if (section.includes(EXPLANATION_MATERIALS_BULLET)) {
    descriptionSource = "explanation-materials";
  }

  let resultSource: BillResultSource = "official";
  if (section.includes(RESULT_SOURCE_BULLET.minutes)) {
    resultSource = "minutes";
  } else if (section.includes(RESULT_SOURCE_BULLET.broadcast)) {
    resultSource = "broadcast";
  }

  return {
    officialPage: pageMatch
      ? { url: pageMatch[2], isOngoing: pageMatch[1] === "提出議案" }
      : null,
    descriptionSource,
    resultSource,
  };
}
