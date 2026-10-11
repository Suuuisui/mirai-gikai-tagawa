import { formatDate } from "@/lib/utils/date";
import { fitDescription, joinWithinLimit } from "./page-description";

/**
 * 検索結果と共有（SNS）に出す、ページごとの題名と説明。
 * - 題名: 「何のページか＋田川市議会」が分かる形。サイト名はルートの title.template が後ろに付ける
 * - 説明: 80〜120 字。事実だけを書き、あおる表現や、特定の議員・市長を疑わせる表現は使わない
 *   （page-copy.test.ts が長さを検査する）
 */
export interface StaticPageCopy {
  title: string;
  description: string;
}

/** 内容が固定のページ。市長ページのように日付で変わるものはページ側で組み立てる */
export const PAGE_COPY = {
  home: {
    title: "田川市議会の議案・議決結果をやさしく解説",
    description:
      "田川市議会に提出された議案・予算・条例・意見書をAIがやさしい言葉で解説。議決結果、議員ごとの賛否、会期（定例会・臨時会）ごとのまとめ、委員会の記録や一般質問を無料で確認できます。",
  },
  search: {
    title: "田川市議会の議案を検索",
    description:
      "田川市議会に提出された議案を、キーワードで検索できます。議案名・概要・タグに含まれる言葉で絞り込み、予算・条例・決議・意見書など気になる議案の解説と議決結果をすぐに確認できます。",
  },
  sessions: {
    title: "田川市議会 会期ごとのまとめ一覧",
    description:
      "田川市議会の会期（定例会・臨時会）ごとのまとめ一覧。会期の日程、提出議案数や賛否が分かれた議案数がひと目で分かり、会期を選ぶと議決結果の内訳と主な議案の解説を読めます。",
  },
  archive: {
    title: "田川市議会 会期一覧",
    description:
      "田川市議会の全ての会期（定例会・臨時会）を、年ごとに一覧で確認できます。会期を選ぶと、その会期に提出された議案の一覧と、議案ごとの解説・議決結果を見ることができます。",
  },
  members: {
    title: "田川市議会の議員一覧｜賛否・提出議案",
    description:
      "田川市議会の議員ごとの賛否（賛成・反対・欠席）と、市長・議員・委員会など提出者別の議案一覧。誰が提出し、誰が賛成・反対したのかを、市の公開データから確認できます。",
  },
  committees: {
    title: "田川市議会 委員会の記録",
    description:
      "田川市議会の総務文教委員会・百条委員会（特別委員会）など、公式には公開されていない委員会の議事録・審議内容を、情報開示請求で入手した文書と公式YouTube中継をもとに公開しています。",
  },
  questions: {
    title: "田川市議会 一般質問（議員が市に問うこと）",
    description:
      "田川市議会の定例会で議員が市長や市に質問する「一般質問」の通告内容を、平成29年から最新の定例会まで一覧にしました。質問事項・要旨・録画・本会議の記録をまとめて確認できます。",
  },
  petitions: {
    title: "田川市議会 請願・陳情（市民からの要望）の審査結果",
    description:
      "田川市議会に出された請願・陳情の一覧です。要望の内容と提出者が挙げる理由、付託された委員会での審査の経緯、採択・不採択などの結果、紹介議員、原文PDFへのリンクを平成23年5月以降の分からまとめています。",
  },
  elections: {
    title: "田川市の選挙の投票率（年代別・投票区別）",
    description:
      "令和8年7月12日の田川市長選挙と市議会議員補欠選挙の投票率を、年代別（1歳刻み）・投票区別・期日前投票の割合で見られます。令和5年の市議選との比較や、これまでの投票率の推移も掲載しています。",
  },
  sources: {
    title: "情報のもと（出典）について",
    description:
      "みらい議会＠田川市に載せている内容が、何をもとにしているかの説明です。田川市・田川市議会の公式サイトと本会議の会議録、公式YouTube中継の文字起こし、情報開示請求で入手した文書の3種類を、ページごとにバッジで示しています。",
  },
  terms: {
    title: "利用規約",
    description:
      "みらい議会＠田川市の利用規約です。禁止事項、違反行為への対応、AIインタビューの回答やログの取り扱い、知的財産権、情報の不保証、サービスの変更・停止、準拠法・管轄について定めています。",
  },
  privacy: {
    title: "プライバシーポリシー",
    description:
      "みらい議会＠田川市を運営する田川市政ラボのプライバシーポリシーです。個人情報の定義、収集方法と使用範囲、第三者への提供、安全管理措置、Cookieの利用、保管期間、問い合わせ窓口を説明しています。",
  },
} as const satisfies Record<string, StaticPageCopy>;

/**
 * 会期の期間の表記。1 日だけの会期は日付 1 つ、同じ年なら終わりの年を省く
 * （例: 2026年9月7日〜10月8日）
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = formatDate(startDate);
  if (startDate === endDate) return start;

  const end = formatDate(endDate);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  return `${start}〜${sameYear ? end.replace(/^\d{4}年/, "") : end}`;
}

interface SessionCopyInput {
  name: string;
  startDate: string;
  endDate: string;
  billCount: number;
}

/** 会期まとめ（/sessions/[id]）の説明 */
export function describeSessionSummary({
  name,
  startDate,
  endDate,
  billCount,
}: SessionCopyInput): string {
  const range = formatDateRange(startDate, endDate);
  const bills =
    billCount > 0
      ? `提出議案${billCount}件の議決結果の内訳、`
      : "議決結果の内訳、";
  return fitDescription(
    `田川市議会 ${name}（${range}）のまとめ。${bills}賛否が分かれた案件、主な議案のハイライトをまとめ、各議案の解説ページへもたどれます。`
  );
}

/** 会期別の議案一覧（/archive/[slug]/bills）の説明 */
export function describeSessionBills({
  name,
  startDate,
  endDate,
  billCount,
}: SessionCopyInput): string {
  const range = formatDateRange(startDate, endDate);
  const bills = billCount > 0 ? `議案${billCount}件` : "議案";
  return fitDescription(
    `田川市議会 ${name}（${range}）に提出された${bills}の一覧。議案ごとのやさしい解説と、可決・否決などの議決結果、議決日を確認できます。`
  );
}

/** タグ別の議案一覧（/tags/[tagId]）の説明。description はタグに登録された一言説明 */
export function describeTagBills({
  label,
  description,
  billCount,
}: {
  label: string;
  description?: string | null;
  billCount: number;
}): string {
  const note = description?.trim().replace(/。$/, "");
  return fitDescription(
    `田川市議会に提出された議案のうち、「${label}」${note ? `（${note}）` : ""}に関するもの${billCount}件の一覧です。会期をまたいで、議案ごとのやさしい解説と、可決・否決などの議決結果、議決日を確認できます。`
  );
}

/**
 * 提出者別の議案一覧（/proposers/[proposer]）の説明。description は提出者区分の説明文。
 * 先頭を「一覧できます」と「N件を掲載」の短い 2 文に分けているのは、件数の桁が変わっても、
 * 区分の説明文を文の切れ目で切った長さが 80〜120 字に収まり、「…」で切れないようにするため
 * （1 文にすると、委員会提出が 1〜9 件のとき 79 字になり、文の途中で切れていた）。
 * page-copy.test.ts が、実際の説明文と全ての提出者区分で検査する
 */
export function describeProposerBills({
  label,
  description,
  billCount,
}: {
  label: string;
  description: string;
  billCount: number;
}): string {
  return fitDescription(
    `田川市議会の${label}議案を一覧できます。議決日の新しい順に${billCount}件を掲載しています。${description}`
  );
}

/** 議員ページ（/members/[name]）の説明。賛否の数は評価ではない旨を添える */
export function describeMember({
  displayName,
  voteCount,
}: {
  displayName: string;
  voteCount: number;
}): string {
  const votes = voteCount > 0 ? `（${voteCount}議案）` : "";
  return fitDescription(
    `田川市議会 ${displayName} 議員の、市が公表した賛否（賛成・反対・欠席）の記録${votes}と、提出者・賛成者として連署した議案の一覧です。賛否の数は議員の評価を示すものではありません。`
  );
}

/** 会期ごとの一般質問（/questions/[sessionKey]）の説明 */
export function describeQuestionSession({
  sessionName,
  memberNames,
}: {
  sessionName: string;
  memberNames: readonly string[];
}): string {
  return joinWithinLimit({
    prefix: `田川市議会 ${sessionName}で${memberNames.length}人の議員が通告した一般質問の質問事項と要旨を掲載しています。質問者: `,
    items: memberNames,
    overflow: (omitted) => `ほか${omitted}人`,
  });
}
