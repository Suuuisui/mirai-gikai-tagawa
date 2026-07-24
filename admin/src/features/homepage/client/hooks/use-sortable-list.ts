"use client";

import {
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * ドラッグ＆ドロップで並び替えるリスト編集の共通セットアップ。
 * DndContext にそのまま渡せる props（sensors / collisionDetection / onDragEnd）を返す。
 */
export function useSortableList<T>(
  items: T[],
  setItems: (items: T[]) => void,
  getId: (item: T) => string
) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => getId(item) === active.id);
    const newIndex = items.findIndex((item) => getId(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setItems(arrayMove(items, oldIndex, newIndex));
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    onDragEnd: handleDragEnd,
  };
}
