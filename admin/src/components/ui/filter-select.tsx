"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  label: string;
  /** 同じラベルのセレクトが画面に複数あるとき、支援技術向けに区別できる名前を渡す（既定は label） */
  ariaLabel?: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  /** 選択肢が長いときにトリガーの幅を広げる（既定は w-40） */
  triggerClassName?: string;
}

/** ラベル付きのセレクト。一覧や候補の絞り込み（URLのクエリや画面内の state と同期させる用途）で使う */
export function FilterSelect({
  label,
  ariaLabel = label,
  value,
  options,
  onChange,
  triggerClassName = "w-40",
}: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={ariaLabel}
          className={cn("h-9", triggerClassName)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
