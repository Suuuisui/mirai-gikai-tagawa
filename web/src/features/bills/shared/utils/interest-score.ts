import type { Bill, BillContent } from "../types";
import { parseExplanationMaterialUrls } from "./explanation-materials";

// ============================================================
// スコア定数
// ============================================================
// トップページの「タグ別議案一覧」を興味度順に並べ替えるための加点ルール。
// 日付順だと補正予算や定型の条例改正が上位を占めてしまうため、
// 「議会が割れた／読み応えがある」議案を上位に引き上げる。

/**
 * 異例の議決（否決・不認定など）。
 * 議会が割れた・差し戻した案件はこのサイトの存在意義そのものなので最重要視する。
 */
const SCORE_CONTROVERSIAL_STATUS = 50;
const CONTROVERSIAL_STATUS_PATTERN =
  /否決|不認定|不採択|修正議決|懲罰|戒告|継続審議/;

/** 手動キュレーション済み（運営がおすすめとして選定した議案） */
const SCORE_FEATURED = 30;

/** 票が割れた・討論があった形跡（反対討論 or 賛成多数の記述） */
const SCORE_DEBATED = 25;
const DEBATED_CONTENT_KEYWORDS = ["反対討論", "賛成多数"];

/** AIが「議会での主な論点」を書けるほど論点が明確な議案 */
const SCORE_HAS_ISSUE_SECTION = 15;
const ISSUE_SECTION_HEADING = "## 議会での主な論点";

/** 当初予算（一般会計予算）は自治体の1年を左右するため補正予算より読み応えがある */
const SCORE_INITIAL_BUDGET = 10;
const INITIAL_BUDGET_KEYWORD = "一般会計予算";
const SUPPLEMENTARY_BUDGET_KEYWORD = "補正";

/** 住民の生活に直結するテーマは関心が高い */
const SCORE_LIFESTYLE_KEYWORD = 8;
const LIFESTYLE_KEYWORD_PATTERN =
  /給食|学校|子ど|保育|水道|病院|ごみ|料金|手数料|図書館|公園|バス|税/;

/** 説明資料PDFがあると読み物として厚みが増す */
const SCORE_HAS_EXPLANATION_MATERIAL = 2;

/**
 * 定型議案ペナルティ。人事同意・専決処分の承認等は形式的で読み物として薄いため減点する。
 */
const SCORE_ROUTINE_PENALTY = -15;
const ROUTINE_BILL_PATTERN =
  /任命|選任|同意を求める|専決処分|人権擁護委員|固定資産評価/;

/**
 * 新しさボーナス。スコアに「新しさ」の要素がないと、古い否決議案が新しい注目議案
 * より上に来ることがあり、トップページが「今」の関心を反映できないため加点する。
 * 400日 = 直近1年間＋定例会のずれを吸収する余裕を見た閾値。
 * 800日 = 概ね2年圏内であればまだ「新しい」とみなす閾値。
 */
const SCORE_SUBMITTED_WITHIN_400_DAYS = 15;
const SCORE_SUBMITTED_WITHIN_800_DAYS = 8;
const RECENCY_BONUS_HIGH_THRESHOLD_DAYS = 400;
const RECENCY_BONUS_LOW_THRESHOLD_DAYS = 800;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 「本当に話題性が高い」と言えるスコアの下限。
 *
 * 「議会での主な論点」見出し(+15)や「反対討論」の記述(+25)は、AIが解説記事を
 * 書く際にほぼ定型で入るため、賛成多数で穏当に可決された議案でもこれだけで
 * 50点前後まで積み上がる（実例: 賛成14反対5で認定された決算議案が、反対討論
 * ＋論点見出し＋生活密着キーワードのヒットだけで48点）。テンプレート由来の
 * 加点だけでは超えられない水準を要求し、争点・否決・直近性など、追加の根拠を
 * 持つ議案だけをこの閾値超えとして扱う。
 */
export const MIN_NOTABLE_SCORE = 50;

/**
 * 定例会1回分＋余裕の期間。これより古い議案は、どれほど劇的な議決でも
 * 「今まさに話題」とは扱わない（トップページのタグ別セクション自動昇格の
 * 判定用）。
 */
export const HOT_TOPIC_WINDOW_DAYS = 90;

type BillContentForScore = Pick<BillContent, "title" | "summary" | "content">;

/**
 * スコア計算に必要なフィールドのみを持つ型。
 * `findPublishedBillsByTag()` が返す行の `bills` 部分（bill_contents を含む）と同じ形。
 */
export type BillForInterestScore = Pick<
  Bill,
  | "status_note"
  | "name"
  | "is_featured"
  | "explanation_material_urls"
  | "submitted_date"
> & {
  bill_contents?: BillContentForScore[] | BillContentForScore | null;
};

function getSingleBillContent(
  bill: BillForInterestScore
): BillContentForScore | undefined {
  const { bill_contents } = bill;
  return Array.isArray(bill_contents)
    ? bill_contents[0]
    : (bill_contents ?? undefined);
}

/**
 * 議案の「興味度スコア」を計算する純粋関数。
 * トップページのタグ別議案一覧のみで使用し、タグ詳細ページ等は従来通り日付順のまま。
 * @param now 新しさボーナスの基準時刻。省略時は現在時刻（テストで日付を固定する用途）。
 */
export function computeBillInterestScore(
  bill: BillForInterestScore,
  now: Date = new Date()
): number {
  const content = getSingleBillContent(bill);
  const title = content?.title ?? "";
  const summary = content?.summary ?? "";
  const body = content?.content ?? "";

  let score = 0;

  if (
    bill.status_note !== null &&
    CONTROVERSIAL_STATUS_PATTERN.test(bill.status_note)
  ) {
    score += SCORE_CONTROVERSIAL_STATUS;
  }

  if (bill.is_featured) {
    score += SCORE_FEATURED;
  }

  if (DEBATED_CONTENT_KEYWORDS.some((keyword) => body.includes(keyword))) {
    score += SCORE_DEBATED;
  }

  if (body.includes(ISSUE_SECTION_HEADING)) {
    score += SCORE_HAS_ISSUE_SECTION;
  }

  const nameAndTitle = `${bill.name}${title}`;
  if (
    nameAndTitle.includes(INITIAL_BUDGET_KEYWORD) &&
    !nameAndTitle.includes(SUPPLEMENTARY_BUDGET_KEYWORD)
  ) {
    score += SCORE_INITIAL_BUDGET;
  }

  if (LIFESTYLE_KEYWORD_PATTERN.test(`${bill.name}${title}${summary}`)) {
    score += SCORE_LIFESTYLE_KEYWORD;
  }

  if (parseExplanationMaterialUrls(bill.explanation_material_urls).length > 0) {
    score += SCORE_HAS_EXPLANATION_MATERIAL;
  }

  if (ROUTINE_BILL_PATTERN.test(bill.name)) {
    score += SCORE_ROUTINE_PENALTY;
  }

  if (bill.submitted_date !== null) {
    const elapsedDays =
      (now.getTime() - new Date(bill.submitted_date).getTime()) / MS_PER_DAY;
    if (elapsedDays <= RECENCY_BONUS_HIGH_THRESHOLD_DAYS) {
      score += SCORE_SUBMITTED_WITHIN_400_DAYS;
    } else if (elapsedDays <= RECENCY_BONUS_LOW_THRESHOLD_DAYS) {
      score += SCORE_SUBMITTED_WITHIN_800_DAYS;
    }
  }

  return score;
}

/**
 * 「直近の会期で実際に話題になった議案」かどうかを判定する。
 * 興味度スコアが MIN_NOTABLE_SCORE を超えるだけでは、去年の否決議案のように
 * 「かつて話題だった」議案も拾ってしまう。トップページのタグ別セクション
 * 自動昇格は「今まさに話題」なセクションのみを対象にしたいため、閾値超えに
 * 加えて submitted_date が HOT_TOPIC_WINDOW_DAYS 以内であることも要求する。
 * @param now 経過日数計算の基準時刻。省略時は現在時刻（テストで日付を固定する用途）。
 */
export function isHotTopicBill(
  bill: BillForInterestScore,
  now: Date = new Date()
): boolean {
  if (bill.submitted_date === null) {
    return false;
  }

  const elapsedDays =
    (now.getTime() - new Date(bill.submitted_date).getTime()) / MS_PER_DAY;
  if (elapsedDays > HOT_TOPIC_WINDOW_DAYS) {
    return false;
  }

  return computeBillInterestScore(bill, now) > MIN_NOTABLE_SCORE;
}

/**
 * 興味度スコアによる並べ替えで共通して使うソートキー。
 * スコア降順 → submittedDate の降順（新しい順、null は末尾） →
 * id の昇順（安定化）で比較する。
 */
export type InterestSortKey = {
  score: number;
  submittedDate: string | null;
  id: string;
};

/**
 * `toKey` で各要素をソートキーに変換し、興味度スコアの降順で並べ替える汎用関数。
 * タグ別議案一覧（ネスト構造）・前回会期プレビュー（フラット構造）・会期ハイライト
 * （BillWithContent）など、入力の型は異なるが同じ並び替えポリシーを共有したい
 * 複数箇所から使われる。
 */
export function sortByInterestKey<T>(
  items: T[],
  toKey: (item: T) => InterestSortKey
): T[] {
  return items
    .map((item) => ({ item, key: toKey(item) }))
    .sort((a, b) => {
      if (a.key.score !== b.key.score) return b.key.score - a.key.score;

      const dateA = a.key.submittedDate;
      const dateB = b.key.submittedDate;
      if (dateA !== dateB) {
        if (dateA === null) return 1;
        if (dateB === null) return -1;
        return dateA < dateB ? 1 : -1;
      }

      if (a.key.id === b.key.id) return 0;
      return a.key.id < b.key.id ? -1 : 1;
    })
    .map(({ item }) => item);
}

/**
 * `sortBillsTagRowsByDateDesc`（同階層 map-bills-tag-rows.ts）と同じ入力形状
 * （`bills_tags` 起点のネスト構造）を受け取り、興味度スコアの降順で並べ替える。
 */
export function sortBillsTagRowsByInterestDesc<
  T extends {
    bills: (BillForInterestScore & { id: string }) | null;
  },
>(rows: T[]): T[] {
  // ソート中に new Date() が複数回呼ばれて時刻がブレないよう、一度だけ取得して使い回す
  const now = new Date();

  return sortByInterestKey(rows, (row) => ({
    score: row.bills
      ? computeBillInterestScore(row.bills, now)
      : Number.NEGATIVE_INFINITY,
    submittedDate: row.bills?.submitted_date ?? null,
    id: row.bills?.id ?? "",
  }));
}
