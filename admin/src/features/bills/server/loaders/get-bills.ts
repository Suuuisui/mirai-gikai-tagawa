import type {
  BillListFilter,
  BillSortConfig,
  BillWithDietSession,
} from "../../shared/types";
import { findBillsWithDietSessions } from "../repositories/bill-repository";

export async function getBills(
  sortConfig?: BillSortConfig,
  filter?: BillListFilter
): Promise<BillWithDietSession[]> {
  const data = await findBillsWithDietSessions(sortConfig, filter);
  return data || [];
}
