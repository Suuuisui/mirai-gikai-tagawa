"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DietSessionFilterSelect } from "@/features/diet-sessions/client/components/diet-session-filter-select";
import type { DietSessionFilterSource } from "@/features/diet-sessions/shared/types";
import { BILL_DIET_SESSION_PARAM } from "../../../shared/constants/bill-list-params";

interface BillSessionFilterProps {
  dietSessions: DietSessionFilterSource[];
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

  const handleChange = (sessionId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sessionId === null) {
      params.delete(BILL_DIET_SESSION_PARAM);
    } else {
      params.set(BILL_DIET_SESSION_PARAM, sessionId);
    }
    router.replace(`${pathname}?${params.toString()}` as Route);
  };

  return (
    <DietSessionFilterSelect
      dietSessions={dietSessions}
      sessionId={selectedSessionId}
      onChange={handleChange}
    />
  );
}
