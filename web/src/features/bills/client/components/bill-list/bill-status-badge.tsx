import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";
import {
  getCardStatusLabel,
  getStatusVariant,
} from "../../../shared/utils/bill-status";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  /** bills.status_note。議決済みの議案の語（認定・同意・不認定など）を決めるのに使う */
  statusNote: string | null;
  className?: string;
}

/** 色は status（成立した／しなかった／審議中）、語は status_note から決める */
export function BillStatusBadge({
  status,
  statusNote,
  className,
}: BillStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getCardStatusLabel(status, statusNote)}
    </Badge>
  );
}
