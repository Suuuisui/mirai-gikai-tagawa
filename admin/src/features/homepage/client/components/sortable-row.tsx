"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ドラッグで並び替えできる行のラッパー。
 * 左側にドラッグハンドルと表示位置（1始まり）を表示する。
 */
export function SortableRow({
  id,
  position,
  children,
}: {
  id: string;
  position: number;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2",
        isDragging && "relative z-10 opacity-90"
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="ドラッグして並び替え"
          className="h-8 w-6 cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </Button>
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {position}
        </span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
