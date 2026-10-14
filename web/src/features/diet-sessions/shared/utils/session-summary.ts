import type { Bill, BillWithContent } from "@/features/bills/shared/types";
import {
  type BillForInterestScore,
  computeBillBaseInterestScore,
  isControversialStatus,
  MIN_NOTABLE_SCORE,
  sortByInterestKey,
} from "@/features/bills/shared/utils/interest-score";
import type { DietSessionNavItem } from "../types";

// ============================================================
// summarizeSessionResults
// ============================================================

/**
 * 否決系のstatus_noteパターン。interest-score.ts の
 * CONTROVERSIAL_STATUS_PATTERN と対象を合わせつつ、ここでは「議決の結果が
 * 否決だった」ことが明確なものだけに絞る（修正議決・懲罰・継続審議等は
 * 可決/否決のどちらとも言えないため「その他」に分類する）。
 */
const REJECTED_STATUS_NOTE_PATTERN = /否決|不認定|不採択/;

/**
 * 可決系のstatus_noteパターン。「不認定」「不採択」は「認定」「採択」を
 * 部分文字列として含むため、呼び出し側で必ず否決判定を先に行うこと。
 */
const PASSED_STATUS_NOTE_PATTERN = /可決|同意|承認|認定|採択/;

type BillForSummary = Pick<Bill, "status" | "status_note" | "member_votes">;

type ResultClassification = "passed" | "rejected" | "other";

/**
 * 議案1件の議決結果を「可決」「否決」「その他（継続審議・懲罰等）」に分類する。
 * status_note（自由記述）を優先し、記載が無い場合のみ status（enum）に
 * フォールバックする。
 */
function classifyBillResult(bill: BillForSummary): ResultClassification {
  // 本会議でまだ議決されていない議案（会期中）は、status_note に委員会の結論
  // （「委員会で認定と決定」「不認定と決定」など）が書かれていても数えない
  if (bill.status === "introduced") return "other";

  const note = bill.status_note;

  // status_noteがない場合のみ status（enum）にフォールバックする。
  // note があるのにどちらのパターンにも一致しない場合（継続審議・懲罰等）は
  // 「その他」として扱う（status が enacted でも可決/否決とは言い切れないため）。
  if (note === null) {
    if (bill.status === "enacted") return "passed";
    if (bill.status === "rejected") return "rejected";
    return "other";
  }

  // 「不認定」「不採択」は可決パターンにも部分一致するため、否決判定を先に行う
  if (REJECTED_STATUS_NOTE_PATTERN.test(note)) {
    return "rejected";
  }
  if (PASSED_STATUS_NOTE_PATTERN.test(note)) {
    return "passed";
  }
  return "other";
}

export type SessionResultsSummary = {
  /** 提出議案の総数 */
  total: number;
  /** 可決・同意・承認・認定など、成立した議案の数 */
  passed: number;
  /** 否決・不認定・不採択など、成立しなかった議案の数 */
  rejected: number;
  /** 継続審議・懲罰など、可決/否決のどちらとも言えない議案の数 */
  other: number;
  /** 議員別の賛否データ（member_votes）が登録されている議案の数 */
  splitCount: number;
};

/**
 * 会期に提出された議案一覧から、「数字でみるこの会期」セクション用の
 * 集計値を算出する純粋関数。
 */
export function summarizeSessionResults(
  bills: BillForSummary[]
): SessionResultsSummary {
  let passed = 0;
  let rejected = 0;
  let other = 0;
  let splitCount = 0;

  for (const bill of bills) {
    switch (classifyBillResult(bill)) {
      case "passed":
        passed += 1;
        break;
      case "rejected":
        rejected += 1;
        break;
      default:
        other += 1;
        break;
    }

    if (bill.member_votes !== null) {
      splitCount += 1;
    }
  }

  return { total: bills.length, passed, rejected, other, splitCount };
}

// ============================================================
// pickSessionHighlights
// ============================================================

/**
 * BillWithContent（`bill_content` 単数フィールド）を、
 * 興味度スコアの関数が期待する形（`bill_contents`）に変換する。
 * 本会議でまだ議決されていない議案（会期中）の status_note には委員会の結論
 * （「委員会で不認定と決定」など）が入るため、議決の結果としては数えない
 */
function toInterestScoreInput(bill: BillWithContent): BillForInterestScore {
  return {
    ...bill,
    status_note: bill.status === "introduced" ? null : bill.status_note,
    bill_contents: bill.bill_content ?? null,
  };
}

/**
 * 会期の議案一覧から「🔥この会期のハイライト」に出す議案を、上位 `count` 件まで選ぶ純粋関数。
 *
 * 対象にするのは次のどちらかに当たる議案で、該当が無い会期ではハイライトなし（空配列）を返す。
 * - 否決・不認定・継続審議など異例の議決があった議案（トップページのタグ別セクションの
 *   自動昇格と同じ isControversialStatus。会期のページなので90日の期限は付けない）。
 *   本会議でまだ議決されていない議案（会期中）は、status_note に委員会の結論が書かれていても数えない
 * - 中身の点数（computeBillBaseInterestScore。新しさの加点を含まない）が MIN_NOTABLE_SCORE を超える議案
 *
 * 並び順は中身の点数の高い順（→ 議決日の新しい順 → id）。新しさの加点を使わないのは、
 * 同じ会期の議案は提出時期がほぼ同じで比べる意味が無く、加点を足すと直近の会期だけ
 * 解説の定型の加点で閾値を超えてしまうため
 */
export function pickSessionHighlights(
  bills: BillWithContent[],
  count: number
): BillWithContent[] {
  const scored = bills.map((bill) => {
    const input = toInterestScoreInput(bill);
    return {
      bill,
      isControversial: isControversialStatus(input.status_note),
      score: computeBillBaseInterestScore(input),
    };
  });

  const eligible = scored.filter(
    ({ isControversial, score }) => isControversial || score > MIN_NOTABLE_SCORE
  );

  return sortByInterestKey(eligible, ({ bill, score }) => ({
    score,
    submittedDate: bill.submitted_date,
    id: bill.id,
  }))
    .slice(0, count)
    .map(({ bill }) => bill);
}

// ============================================================
// findAdjacentSessions
// ============================================================

export type AdjacentSessions = {
  /** 開始日が直前の会期（無ければnull） */
  previous: DietSessionNavItem | null;
  /** 開始日が直後の会期（無ければnull） */
  next: DietSessionNavItem | null;
};

/**
 * 会期一覧の中から、指定した会期の開始日基準で前後の会期を求める純粋関数。
 * `sessions` の並び順は問わない（内部で start_date 昇順にソートする）。
 * currentId が sessions に存在しない場合は previous/next とも null を返す。
 */
export function findAdjacentSessions(
  sessions: DietSessionNavItem[],
  currentId: string
): AdjacentSessions {
  const sorted = [...sessions].sort((a, b) => {
    if (a.start_date === b.start_date) return 0;
    return a.start_date < b.start_date ? -1 : 1;
  });

  const index = sorted.findIndex((session) => session.id === currentId);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
