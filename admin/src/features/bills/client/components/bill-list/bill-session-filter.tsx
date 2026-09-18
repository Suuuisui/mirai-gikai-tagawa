"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterSelect } from "@/components/ui/filter-select";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import {
  ALL_DIET_SESSIONS,
  BILL_DIET_SESSION_PARAM,
} from "../../../shared/constants/bill-list-params";

export type DietSessionOption = Pick<DietSession, "id" | "name" | "is_active">;

interface BillSessionFilterProps {
  dietSessions: DietSessionOption[];
  /** 選択中の会期ID（全会期なら null） */
  selectedSessionId: string | null;
}

/**
 * 議案一覧を会期で絞り込むセレクト。選択は ?dietSession= に写し、
 * ソート（?sort= / ?order=）はそのまま保つ
 */
export function BillSessionFilter({
  dietSessions,
  selectedSessionId,
}: BillSessionFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = [
    { value: ALL_DIET_SESSIONS, label: "すべての会期" },
    ...dietSessions.map((session) => ({
      value: session.id,
      label: session.is_active ? `${session.name}（アクティブ）` : session.name,
    })),
  ];

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_DIET_SESSIONS) {
      params.delete(BILL_DIET_SESSION_PARAM);
    } else {
      params.set(BILL_DIET_SESSION_PARAM, value);
    }
    router.replace(`${pathname}?${params.toString()}` as Route);
  };

  return (
    <FilterSelect
      label="会期"
      value={selectedSessionId ?? ALL_DIET_SESSIONS}
      options={options}
      onChange={handleChange}
      triggerClassName="w-full sm:w-[360px]"
    />
  );
}
