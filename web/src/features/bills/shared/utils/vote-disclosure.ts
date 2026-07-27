/**
 * 議員別賛否の公開状況の判定【田川市専用】
 *
 * 田川市議会は「賛否が分かれた案件」についてのみ、議員別の賛否（○×表）を
 * 議決結果ページに公開している。このため bills.member_votes が無い議案は
 * 原則として「賛否が分かれなかった＝全会一致」を意味する。
 *
 * ただし以下の例外があるため、単純な「データ無し＝全会一致」判定はしない:
 * - 無記名投票で採決された7議案（不信任決議・辞職勧告など）は、市も
 *   議員別の賛否を公表していない（賛否は分かれている）
 * - 令和元年12月定例会（r1-5-teirei）は議決結果ページ自体が無く、
 *   議決結果を会議録から補完しているため、賛否表の有無から全会一致とは言えない
 * - 否決・継続審議など可決系以外の結果は、全会一致と断定できるだけの
 *   情報が無いため対象外とする
 *
 * 出典・経緯: docs/20260717_1500_課題とロードマップ.md（賛否画像は30会期中
 * 27会期で公開、121議案転記済み・無記名投票7件は市も非公開）
 */

export type VoteDisclosure =
  /** 議員別の賛否が公開されている（member_votesあり） */
  | "published"
  /** 賛否が分かれず全会一致で議決された */
  | "unanimous"
  /** 無記名投票のため議員別の賛否が公表されていない */
  | "secret_ballot"
  /** 公開状況を判定できない（表示しない） */
  | "unknown";

/**
 * 無記名投票で採決された議案。キーは `{会期slug}:{bills.name}`。
 * bills.name は「{議案番号ラベル}　{件名}」（全角スペース区切り、build-csv.ts参照）。
 * 同一会期に市長提出と議員提出で同じ議案番号が存在し得るため（例: r7-6の
 * 議案第44号）、件名まで含めた完全一致で判定する
 */
const SECRET_BALLOT_BILL_KEYS: ReadonlySet<string> = new Set([
  "r7-1-teirei:議案第38号　村上卓哉田川市長に対する不信任決議について",
  "r7-1-teirei:議案第40号　村上卓哉田川市長に対する辞職勧告決議について",
  "r7-2-rinji:議案第41号　村上卓哉田川市長に対する不信任決議について",
  "r7-3-rinji:議案第42号　田川市議会議長不信任決議について",
  "r7-5-rinji:議案第43号　田川市議会議長不信任決議について",
  "r7-6-teirei:議案第44号　田川市議会議長不信任決議について",
  "r7-7-teirei:議員提出議案第52号　田川市議会議長不信任決議について",
]);

/** 議決結果ページが存在しない会期（議決結果は会議録から補完している） */
const SESSIONS_WITHOUT_RESULT_PAGE: ReadonlySet<string> = new Set([
  "r1-5-teirei",
]);

/**
 * 「全会一致」と判定してよい議決結果。可決系のみを対象とし、
 * 否決系・修正議決・懲罰などの特殊な結果は unknown 扱いにする
 */
const UNANIMOUS_ELIGIBLE_RESULTS: ReadonlySet<string> = new Set([
  "原案可決",
  "可決",
  "同意",
  "承認",
  "認定",
  "採択",
]);

export function resolveVoteDisclosure(input: {
  /** member_votes（parseMemberVotes済みでなくてよい。null/undefined = データ無し） */
  hasMemberVotes: boolean;
  /** 議案名（bills.name） */
  billName: string;
  /** 所属会期のslug。不明な場合はnull */
  sessionSlug: string | null;
  /** 議決結果（bills.status_note） */
  statusNote: string | null;
}): VoteDisclosure {
  if (input.hasMemberVotes) {
    return "published";
  }

  if (input.sessionSlug === null) {
    return "unknown";
  }

  if (SECRET_BALLOT_BILL_KEYS.has(`${input.sessionSlug}:${input.billName}`)) {
    return "secret_ballot";
  }

  if (SESSIONS_WITHOUT_RESULT_PAGE.has(input.sessionSlug)) {
    return "unknown";
  }

  if (
    input.statusNote !== null &&
    UNANIMOUS_ELIGIBLE_RESULTS.has(input.statusNote)
  ) {
    return "unanimous";
  }

  return "unknown";
}
