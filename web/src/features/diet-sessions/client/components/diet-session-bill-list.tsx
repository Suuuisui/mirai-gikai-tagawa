import { ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import type { BillWithContent } from "@/features/bills/shared/types";
import type { DietSession } from "../../shared/types";
import { BillListWithStatusFilter } from "./bill-list-with-status-filter";

type Props = {
  session: DietSession;
  bills: BillWithContent[];
};

export function DietSessionBillList({ session, bills }: Props) {
  const startDate = new Date(session.start_date);
  const endDate = new Date(session.end_date);
  const sessionDescription = `${startDate.getFullYear()}.${startDate.getMonth() + 1}月〜${endDate.getMonth() + 1}月に実施された${session.name}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Archiveヘッダー */}
      <div className="flex flex-col gap-1.5">
        <SectionHeading as="h1">過去の議会アーカイブ</SectionHeading>
        <p className="text-sm text-mirai-text-muted">
          過去の田川市議会に提出された議案
        </p>
      </div>

      {/* セクションヘッダー */}
      <div className="flex flex-col gap-0.5">
        <SectionHeading className="flex items-center gap-4">
          {startDate.getFullYear()}年 {session.name}の提出議案
          <span className="shrink-0 whitespace-nowrap">{bills.length}件</span>
        </SectionHeading>
        <p className="text-xs font-medium text-mirai-text">
          {sessionDescription}
        </p>
      </div>

      {/* フィルター付き議案リスト */}
      {bills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          この会期の議案はまだありません
        </p>
      ) : (
        <BillListWithStatusFilter bills={bills} />
      )}

      {/* 議案情報リンク */}
      {session.shugiin_url && (
        <div className="flex items-center gap-1 text-[13px] font-medium text-mirai-text">
          {startDate.getFullYear()}年{session.name}に提出された全ての議案は
          <a
            href={session.shugiin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            田川市議会議案情報へ
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
