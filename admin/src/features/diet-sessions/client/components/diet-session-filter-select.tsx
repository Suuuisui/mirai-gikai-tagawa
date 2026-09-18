"use client";

import { FilterSelect } from "@/components/ui/filter-select";
import type { DietSessionFilterSource } from "../../shared/types";
import {
  ALL_DIET_SESSIONS,
  buildDietSessionFilterOptions,
} from "../../shared/utils/build-diet-session-filter-options";

/**
 * 会期で絞り込むセレクト。「すべての会期」は null として親に渡すので、
 * 呼び出し側は番兵値（ALL_DIET_SESSIONS）を意識せず、選択をURLに写すか
 * 画面内の state に持つかだけを決めればよい
 */
export function DietSessionFilterSelect({
  dietSessions,
  sessionId,
  onChange,
  ariaLabel,
  triggerClassName = "w-full sm:w-[360px]",
}: {
  dietSessions: DietSessionFilterSource[];
  /** 選択中の会期ID（全会期なら null） */
  sessionId: string | null;
  onChange: (sessionId: string | null) => void;
  /** 同じセレクトが画面に複数並ぶとき（タグ枠ごとなど）に区別するための名前 */
  ariaLabel?: string;
  triggerClassName?: string;
}) {
  return (
    <FilterSelect
      label="会期"
      ariaLabel={ariaLabel}
      value={sessionId ?? ALL_DIET_SESSIONS}
      options={buildDietSessionFilterOptions(dietSessions)}
      onChange={(value) => onChange(value === ALL_DIET_SESSIONS ? null : value)}
      triggerClassName={triggerClassName}
    />
  );
}
