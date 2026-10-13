import type { BillStatusEnum } from "../types";
import { getBillResultLabel } from "./bill-result-label";

/**
 * カード用の簡略化されたステータスラベルを取得。
 * 議決済みの議案は、議決の種類に合った語（認定・同意・承認・不認定など）を
 * bills.status_note から決める（bill-result-label.ts）。
 * 審議中の議案は status_note に委員会の結論などが入るので使わない
 */
export function getCardStatusLabel(
  status: BillStatusEnum,
  statusNote?: string | null
): string {
  switch (status) {
    case "introduced":
    case "in_originating_house":
    case "in_receiving_house":
      return "田川市議会審議中";
    case "enacted":
    case "rejected":
      return getBillResultLabel(status, statusNote);
    default:
      return "議案提出前";
  }
}

/** ステータスに対応するBadgeのvariantを取得 */
export function getStatusVariant(
  status: BillStatusEnum
): "light" | "default" | "dark" | "muted" {
  switch (status) {
    case "introduced":
    case "in_originating_house":
    case "in_receiving_house":
      return "light";
    case "enacted":
      return "default";
    case "rejected":
      return "dark";
    default:
      return "muted";
  }
}

/**
 * 議案の日付（bills.submitted_date）に添える語。
 * 田川市のデータでは submitted_date に、議決済み（可決・否決）の議案は議決日、
 * 会期中で結果がまだ無い議案は提出日が入る（seed の resolvedDate）。
 * in_originating_house / in_receiving_house は継続審議（閉会中審査）に付された議案で、
 * 日付はその議決の日
 */
export function getBillDateLabel(
  status: BillStatusEnum
): "議決" | "提出" | "継続審議" {
  switch (status) {
    case "enacted":
    case "rejected":
      return "議決";
    case "in_originating_house":
    case "in_receiving_house":
      return "継続審議";
    default:
      return "提出";
  }
}
