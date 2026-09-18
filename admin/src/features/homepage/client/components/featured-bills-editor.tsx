"use client";

import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DietSessionFilterSelect } from "@/features/diet-sessions/client/components/diet-session-filter-select";
import type { DietSessionFilterSource } from "@/features/diet-sessions/shared/types";
import { saveFeaturedBills } from "../../server/actions/save-featured-bills";
import type { CurationBill } from "../../shared/types";
import {
  filterCandidateBills,
  limitCandidateBills,
} from "../../shared/utils/filter-candidate-bills";
import { useSortableList } from "../hooks/use-sortable-list";
import { BillCurationCard } from "./bill-curation-card";
import { EditorHeader } from "./editor-header";
import { SortableRow } from "./sortable-row";

/**
 * 全会期の候補を一度に表示する最大件数（残りは会期の絞り込みか検索で探す）。
 * 会期で絞り込んだときは1会期分（多くても数十件）なので上限を掛けない
 */
const CANDIDATE_DISPLAY_LIMIT = 20;

/**
 * トップページ「注目の議案」セクションの編集UI。
 * 上段: 現在の表示リスト（ドラッグで並び替え・×で外す）
 * 下段: 追加候補（興味度スコア順・会期の絞り込みと検索で探す）
 * 変更は「保存する」を押すまで公開サイトには反映されない。
 */
export function FeaturedBillsEditor({
  featuredBills,
  candidateBills,
  dietSessions,
}: {
  featuredBills: CurationBill[];
  candidateBills: CurationBill[];
  dietSessions: DietSessionFilterSource[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CurationBill[]>(featuredBills);
  const [search, setSearch] = useState("");
  // 「今の会期の議案をトップに出す」が主な用途なので、アクティブな会期があれば
  // 最初からその会期に絞って表示する（過去の議案は「すべての会期」に切り替えて探す）。
  // アクティブな会期に公開議案が無いときは dietSessions に含まれないので全会期になる
  const activeSession = dietSessions.find((session) => session.is_active);
  const [sessionId, setSessionId] = useState<string | null>(
    activeSession?.id ?? null
  );
  const [isPending, startTransition] = useTransition();

  const savedIds = featuredBills.map((bill) => bill.id).join(",");
  const currentIds = items.map((bill) => bill.id).join(",");
  const isDirty = currentIds !== savedIds;

  const dnd = useSortableList(items, setItems, (bill) => bill.id);

  const selectedIds = new Set(items.map((bill) => bill.id));
  const filteredCandidates = filterCandidateBills(
    candidateBills.filter((bill) => !selectedIds.has(bill.id)),
    { keyword: search, sessionId }
  );
  const { visible: visibleCandidates, hiddenCount: hiddenCandidateCount } =
    limitCandidateBills(filteredCandidates, sessionId, CANDIDATE_DISPLAY_LIMIT);

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveFeaturedBills(items.map((bill) => bill.id));
      if (result.success) {
        toast.success("注目の議案を保存しました。公開サイトに反映されます");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <EditorHeader
        title={`現在の表示（${items.length}件）`}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => setItems(featuredBills)}
        onSave={handleSave}
      />

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
          まだ選ばれていません。下の候補から「追加」してください。
        </p>
      ) : (
        <DndContext id="featured-bills" {...dnd}>
          <SortableContext
            items={items.map((bill) => bill.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((bill, index) => (
                <SortableRow key={bill.id} id={bill.id} position={index + 1}>
                  <BillCurationCard
                    bill={bill}
                    actions={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="注目から外す"
                        className="text-gray-400 hover:text-red-600"
                        onClick={() =>
                          setItems(items.filter((b) => b.id !== bill.id))
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    }
                  />
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="space-y-3 rounded-lg bg-gray-50 p-4">
        <div className="space-y-1">
          <h3 className="font-bold">追加できる議案（興味度スコア順）</h3>
          <p className="text-xs text-gray-500">
            {activeSession
              ? "はじめはアクティブな会期（今の会期）の議案だけを表示しています。過去の議案を探すときは会期を「すべての会期」に切り替えるか、検索してください。"
              : "最新の会期の議案は議決前で興味度スコアが低く、一覧の下に埋もれがちです。会期で絞り込むか、検索してください。"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DietSessionFilterSelect
            dietSessions={dietSessions}
            sessionId={sessionId}
            onChange={setSessionId}
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="議案名・タイトル・タグ名・会期名で検索"
              className="bg-white pl-9"
            />
          </div>
        </div>

        {visibleCandidates.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            該当する議案がありません
          </p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {visibleCandidates.map((bill) => (
              <BillCurationCard
                key={bill.id}
                bill={bill}
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setItems([...items, bill])}
                  >
                    <Plus className="size-4" />
                    追加
                  </Button>
                }
              />
            ))}
          </div>
        )}

        {hiddenCandidateCount > 0 && (
          <p className="text-xs text-gray-500">
            ほかに{hiddenCandidateCount}
            件あります。会期で絞り込むか、検索してください。
          </p>
        )}
      </div>
    </div>
  );
}
