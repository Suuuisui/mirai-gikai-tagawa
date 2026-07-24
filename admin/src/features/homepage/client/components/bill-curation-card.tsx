import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurationBill } from "../../shared/types";

/**
 * キュレーション用の議案カード。
 * 「どの議案をトップに出すか」を比較検討しやすいよう、わかりやすいタイトル・
 * 議決結果・提出日・タグ・興味度スコアをまとめて表示する。
 */
export function BillCurationCard({
  bill,
  compact = false,
  actions,
}: {
  bill: CurationBill;
  /** タグ枠プレビューなど、小さく表示したい場合true */
  compact?: boolean;
  /** 右端に置く操作ボタン（追加・削除など） */
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border bg-white",
        compact ? "px-3 py-2" : "p-4"
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-semibold text-gray-900",
              compact ? "text-sm" : "text-base"
            )}
          >
            {bill.title ?? bill.name}
          </span>
          {bill.isHot && (
            <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
              <Flame className="size-3" />
              話題
            </span>
          )}
        </div>

        {bill.title && (
          <p className="truncate text-xs text-gray-500">{bill.name}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {bill.submittedDate && <span>提出 {bill.submittedDate}</span>}
          {bill.sessionName && <span>{bill.sessionName}</span>}
          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
            興味度 {bill.interestScore}
          </span>
          {bill.statusNote && (
            <span
              className={cn(
                "max-w-60 truncate rounded px-1.5 py-0.5",
                bill.isControversial
                  ? "bg-red-50 font-medium text-red-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {bill.statusNote}
            </span>
          )}
        </div>

        {!compact && bill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bill.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
