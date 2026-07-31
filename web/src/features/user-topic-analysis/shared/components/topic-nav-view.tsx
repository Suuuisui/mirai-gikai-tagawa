import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { TopicFilter } from "../utils/filter-topics";

interface TopicNavViewProps {
  billId: string;
  position: number;
  total: number;
  prevTopicId: string | null;
  nextTopicId: string | null;
  /** 前後リンクのURLに引き継ぐフィルタ。 */
  filter: TopicFilter;
}

/** トピック詳細の前後ナビ（表示専用）。Server/Client の両方から使う。 */
export function TopicNavView({
  billId,
  position,
  total,
  prevTopicId,
  nextTopicId,
  filter,
}: TopicNavViewProps) {
  return (
    // 3カラムグリッドで中央の位置カウンタを常に中央寄せにする
    // （前後リンクの有無にかかわらず位置がぶれないようにする）。
    <div className="grid grid-cols-3 items-center text-[13px] font-medium text-mirai-text">
      {/* 先頭では「前のトピック」を非表示にする。 */}
      <div className="justify-self-start">
        {prevTopicId && (
          <Link
            href={routes.billTopicDetail(billId, prevTopicId, filter) as Route}
            className="flex items-center gap-1 text-primary-accent hover:underline"
          >
            <ChevronLeft className="size-4 shrink-0" />
            前のトピック
          </Link>
        )}
      </div>

      <span className="justify-self-center text-mirai-text-muted">
        {position}/{total}
      </span>

      {/* 末尾では「次のトピック」を非表示にする。 */}
      <div className="justify-self-end">
        {nextTopicId && (
          <Link
            href={routes.billTopicDetail(billId, nextTopicId, filter) as Route}
            className="flex items-center gap-1 text-primary-accent hover:underline"
          >
            次のトピック
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
