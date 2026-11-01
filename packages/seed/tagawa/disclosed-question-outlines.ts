/**
 * 情報開示請求で交付を受けた一般質問の通告書から起こした要旨【田川市専用】
 *
 * 公式サイトに通告書PDFが無い会期（平成29年3月〜令和5年3月の25会期）の要旨を
 * data/disclosed-question-outlines.json（会期キー → 議員ごとの要旨）に持ち、
 * 議員名で突き合わせる。公式ページの順番と通告書の順位はずれることがある
 * （通告書にだけ載っている議員がいる会期がある）ので、順番では結び付けない。
 * 純粋関数のみ。テストは disclosed-question-outlines.test.ts
 */

import type {
  QuestionFormat,
  QuestionOutlineItem,
} from "@mirai-gikai/shared/council/types";
import type { QuestionOutline } from "./question-outline-parser";

export interface DisclosedQuestionOutline {
  /** 通告書の表記（姓名の間に空白なし） */
  memberName: string;
  format: QuestionFormat | null;
  items: QuestionOutlineItem[];
}

/** 会期キー → その会期の通告書 */
export type DisclosedQuestionOutlines = Record<
  string,
  { pdf: string; members: DisclosedQuestionOutline[] }
>;

/** 空白と異体字（瀨→瀬）の違いを無視して議員名を比べるための形 */
export function normalizeMemberName(name: string): string {
  return name.replace(/\s/g, "").replace(/瀨/g, "瀬");
}

/** 会期と議員名から、開示された通告書の要旨を探す */
export function findDisclosedOutline(
  disclosed: DisclosedQuestionOutlines,
  sessionKey: string,
  memberName: string
): Omit<QuestionOutline, "order"> | undefined {
  const target = normalizeMemberName(memberName);
  const found = disclosed[sessionKey]?.members.find(
    (m) => normalizeMemberName(m.memberName) === target
  );
  return found ? { format: found.format, items: found.items } : undefined;
}
