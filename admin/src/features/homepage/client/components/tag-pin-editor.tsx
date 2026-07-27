"use client";

import { BILLS_PER_TAG } from "@mirai-gikai/shared/top-page/config";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveTagPinnedBills } from "../../server/actions/save-tag-pinned-bills";
import type { FeaturedTagSection } from "../../shared/types";
import { BillCurationCard } from "./bill-curation-card";

/**
 * タグ枠の表示議案（3件）を編集するUI。
 * 各枠は「📌固定」か「自動選定」のどちらか。固定した議案が先頭に並び、
 * 残りの枠は興味度スコア順で自動的に埋まる。操作は即座に保存され、
 * 公開サイトにもすぐ反映される。
 */
export function TagPinEditor({ section }: { section: FeaturedTagSection }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCandidates, setShowCandidates] = useState(false);

  const pinnedIds = section.pinnedBillIds;
  const canPinMore = pinnedIds.length < BILLS_PER_TAG;

  const save = (nextPinnedIds: string[], successMessage: string) => {
    startTransition(async () => {
      const result = await saveTagPinnedBills(section.id, nextPinnedIds);
      if (result.success) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const pin = (billId: string) =>
    save([...pinnedIds, billId], "固定しました。公開サイトに反映されます");
  const unpin = (billId: string) =>
    save(
      pinnedIds.filter((id) => id !== billId),
      "固定を解除しました。この枠は自動選定に戻ります"
    );
  const move = (billId: string, direction: -1 | 1) => {
    const index = pinnedIds.indexOf(billId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= pinnedIds.length) return;
    const next = [...pinnedIds];
    [next[index], next[target]] = [next[target], next[index]];
    save(next, "並び順を変更しました");
  };

  if (section.previewBills.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        このタグ枠に表示できる議案がありません（該当議案がすべて「注目の議案」に入っている場合など）
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        この枠に表示される議案（📌固定 → 残りは興味度スコア順で自動選定）:
      </p>

      {/* 表示中の3枠 */}
      <div className="space-y-1.5">
        {section.previewBills.map((bill, index) => {
          const pinnedIndex = pinnedIds.indexOf(bill.id);
          const isPinned = pinnedIndex >= 0;
          return (
            <div key={bill.id} className="flex items-center gap-2">
              <span
                className={
                  isPinned
                    ? "inline-flex w-14 shrink-0 items-center justify-center gap-0.5 rounded bg-blue-100 px-1 py-0.5 text-xs font-medium text-blue-700"
                    : "inline-flex w-14 shrink-0 items-center justify-center rounded bg-gray-100 px-1 py-0.5 text-xs font-medium text-gray-500"
                }
              >
                {isPinned ? (
                  <>
                    <Pin className="size-3" />
                    固定{pinnedIndex + 1}
                  </>
                ) : (
                  "自動"
                )}
              </span>
              <div className="min-w-0 flex-1">
                <BillCurationCard
                  bill={bill}
                  compact
                  actions={
                    <div className="ml-auto flex items-center gap-0.5">
                      {isPinned ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="固定順を上へ"
                            disabled={isPending || pinnedIndex === 0}
                            onClick={() => move(bill.id, -1)}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="固定順を下へ"
                            disabled={
                              isPending || pinnedIndex === pinnedIds.length - 1
                            }
                            onClick={() => move(bill.id, 1)}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-600"
                            disabled={isPending}
                            onClick={() => unpin(bill.id)}
                          >
                            <PinOff className="size-4" />
                            解除
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => pin(bill.id)}
                        >
                          <Pin className="size-4" />
                          固定する
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
              {/* 見た目上の枠番号（公開サイトでの表示位置） */}
              <span className="sr-only">{`${index + 1}枠目`}</span>
            </div>
          );
        })}
      </div>

      {/* 枠外の議案から固定する */}
      {section.pinCandidates.length > 0 && (
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto whitespace-normal text-left text-gray-600"
            onClick={() => setShowCandidates((value) => !value)}
          >
            {showCandidates ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            他の議案を固定する（{section.pinCandidates.length}件）
          </Button>
          {showCandidates && (
            <div className="mt-1.5 max-h-64 space-y-1.5 overflow-y-auto rounded-md bg-gray-50 p-2">
              {!canPinMore && (
                <p className="text-xs text-amber-700">
                  固定は{BILLS_PER_TAG}
                  件が上限です。追加するには、先にいずれかの固定を解除してください
                </p>
              )}
              {section.pinCandidates.map((bill) => (
                <BillCurationCard
                  key={bill.id}
                  bill={bill}
                  compact
                  actions={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || !canPinMore}
                      onClick={() => pin(bill.id)}
                    >
                      <Pin className="size-4" />
                      固定する
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
