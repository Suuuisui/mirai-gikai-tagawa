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
import { EditorHeader } from "./editor-header";
import { SortableRow } from "./sortable-row";
import { TagPinEditor } from "./tag-pin-editor";

/**
 * タグ枠に表示される議案の編集エリア。
 * まだ保存していないタグは表示議案を計算できないため案内文を出す。
 */
function TagSectionBills({ section }: { section: FeaturedTagSection | null }) {
  if (!section) {
    return (
      <p className="text-xs text-gray-500">
        保存すると、この枠に表示される議案のプレビューと固定（ピン留め）設定が使えるようになります
      </p>
    );
  }

  return <TagPinEditor section={section} />;
}

/**
 * トップページ「タグ別セクション」の編集UI。
 * どのタグをどの順で出すかをドラッグで設定する。各タグ枠に出る議案3件は、
 * 固定（ピン留め）した議案が先頭に並び、残りは興味度スコア順の自動選定
 * （枠内の編集は TagPinEditor が担当し、即時保存される）。
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
                      <TagSectionBills section={section} />
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
