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

type BillContentForScore = Pick<BillContent, "title" | "summary" | "content">;

/**
 * スコア計算に必要なフィールドのみを持つ型。
 * `findPublishedBillsByTag()` が返す行の `bills` 部分（bill_contents を含む）と同じ形。
 */
export type BillForInterestScore = Pick<
  Bill,
  "status_note" | "name" | "is_featured" | "explanation_material_urls"
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
 */
export function computeBillInterestScore(bill: BillForInterestScore): number {
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

  return score;
}

/**
 * 興味度スコアの降順 → submitted_date の降順（新しい順、null は末尾） →
 * id の昇順（安定化）で並べ替える。
 * `sortBillsTagRowsByDateDesc`（同階層 map-bills-tag-rows.ts）と同じ入力形状を受け取る。
 */
export function sortBillsTagRowsByInterestDesc<
  T extends {
    bills:
      | (BillForInterestScore & { id: string; submitted_date: string | null })
      | null;
  },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const scoreA = a.bills
      ? computeBillInterestScore(a.bills)
      : Number.NEGATIVE_INFINITY;
    const scoreB = b.bills
      ? computeBillInterestScore(b.bills)
      : Number.NEGATIVE_INFINITY;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const dateA = a.bills?.submitted_date ?? null;
    const dateB = b.bills?.submitted_date ?? null;
    if (dateA !== dateB) {
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateA < dateB ? 1 : -1;
    }

    const idA = a.bills?.id ?? "";
    const idB = b.bills?.id ?? "";
    if (idA === idB) return 0;
    return idA < idB ? -1 : 1;
  });
}
