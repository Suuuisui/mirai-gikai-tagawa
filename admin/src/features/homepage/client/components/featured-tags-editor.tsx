"use client";

import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Flame, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveFeaturedTags } from "../../server/actions/save-featured-tags";
import type { FeaturedTagSection, HiddenTag } from "../../shared/types";
import { useSortableList } from "../hooks/use-sortable-list";
import { BillCurationCard } from "./bill-curation-card";
import { EditorHeader } from "./editor-header";
import { SortableRow } from "./sortable-row";

/**
 * タグ枠の自動選定プレビュー。
 * まだ保存していないタグはプレビューを計算できないため案内文を出す。
 */
function TagSectionPreview({
  section,
}: {
  section: FeaturedTagSection | null;
}) {
  if (!section) {
    return (
      <p className="text-xs text-gray-500">
        保存すると、この枠に自動選定される議案のプレビューが表示されます
      </p>
    );
  }

  if (section.previewBills.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        このタグ枠に表示できる議案がありません（該当議案がすべて「注目の議案」に入っている場合など）
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500">この枠に自動選定で表示される議案:</p>
      {section.previewBills.map((bill) => (
        <BillCurationCard key={bill.id} bill={bill} compact />
      ))}
    </div>
  );
}

/**
 * トップページ「タグ別セクション」の編集UI。
 * どのタグをどの順で出すかをドラッグで設定する。各タグ枠に出る議案3件は
 * 自動選定のため、ここではプレビューとして表示するだけ（変更したい場合は
 * 「注目の議案」に入れる）。
 */
export function FeaturedTagsEditor({
  sections,
  hiddenTags,
}: {
  sections: FeaturedTagSection[];
  hiddenTags: HiddenTag[];
}) {
  const router = useRouter();
  // 編集対象の実体は「表示するタグIDの並び」だけ。表示情報は都度propsから引く
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    sections.map((section) => section.id)
  );
  const [isPending, startTransition] = useTransition();

  const savedIds = sections.map((section) => section.id).join(",");
  const isDirty = orderedIds.join(",") !== savedIds;

  const dnd = useSortableList(orderedIds, setOrderedIds, (id) => id);

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const allTags: HiddenTag[] = [
    ...sections.map(({ id, label, billCount }) => ({ id, label, billCount })),
    ...hiddenTags,
  ];
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const addableTags = allTags.filter((tag) => !orderedIds.includes(tag.id));

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveFeaturedTags(orderedIds);
      if (result.success) {
        toast.success(
          "タグ別セクションを保存しました。公開サイトに反映されます"
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <EditorHeader
        title={`表示中のタグ（${orderedIds.length}件）`}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => setOrderedIds(sections.map((section) => section.id))}
        onSave={handleSave}
      />

      {orderedIds.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
          表示するタグがありません。下の候補から「追加」してください。
        </p>
      ) : (
        <DndContext id="featured-tags" {...dnd}>
          <SortableContext
            items={orderedIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {orderedIds.map((id, index) => {
                const tag = tagById.get(id);
                const section = sectionById.get(id) ?? null;
                if (!tag) return null;
                return (
                  <SortableRow key={id} id={id} position={index + 1}>
                    <div className="space-y-2 rounded-lg border bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {tag.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tag.billCount}件
                          </span>
                          {section?.isHot && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                              <Flame className="size-3" />
                              話題性により実際の表示は上位に昇格中
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="トップページから外す"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() =>
                            setOrderedIds(orderedIds.filter((i) => i !== id))
                          }
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <TagSectionPreview section={section} />
                    </div>
                  </SortableRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="space-y-3 rounded-lg bg-gray-50 p-4">
        <h3 className="font-bold">追加できるタグ</h3>
        {addableTags.length === 0 ? (
          <p className="text-sm text-gray-500">すべてのタグが表示中です</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {addableTags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOrderedIds([...orderedIds, tag.id])}
              >
                <Plus className="size-4" />
                {tag.label}（{tag.billCount}件）
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
