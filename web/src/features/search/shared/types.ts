import type { BillStatusEnum } from "@/features/bills/shared/types";

/** 検索一覧に表示する議案の軽量データ（本文は含めない） */
export interface SearchItem {
  id: string;
  /** bill_content.title（無ければbill.name） */
  title: string;
  /** 議案番号ラベル入りの正式名 */
  name: string;
  /** summaryの先頭120文字程度 */
  summary: string;
  submittedDate: string | null;
  status: BillStatusEnum;
  /** bills.status_note（議決結果の語。バッジの「認定」「同意」などを決めるのに使う） */
  statusNote: string | null;
  tags: string[];
}
