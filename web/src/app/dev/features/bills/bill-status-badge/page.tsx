import { BillStatusBadge } from "@/features/bills/client/components/bill-list/bill-status-badge";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";
import { allBillStatuses } from "../../../_lib/mock-data";

const resultNoteSamples = [
  { status: "enacted", statusNote: "原案可決" },
  { status: "enacted", statusNote: "修正議決" },
  { status: "enacted", statusNote: "認定（本会議の中継映像より）" },
  { status: "enacted", statusNote: "同意" },
  { status: "enacted", statusNote: "承認" },
  { status: "enacted", statusNote: "採択" },
  { status: "rejected", statusNote: "否決" },
  { status: "rejected", statusNote: "不認定" },
  { status: "rejected", statusNote: "不採択" },
] as const;

export default function BillStatusBadgePreview() {
  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        BillStatusBadge
      </h1>

      <ComponentShowcase
        title="All Variants"
        description="@/features/bills/client/components/bill-list/bill-status-badge"
      >
        <PreviewSection label="全ステータス（status_note なし）">
          <div className="flex flex-wrap gap-3">
            {allBillStatuses.map((status) => (
              <BillStatusBadge key={status} status={status} statusNote={null} />
            ))}
          </div>
        </PreviewSection>
        <PreviewSection label="議決結果ごとの語（status_note から決める）">
          <div className="flex flex-wrap gap-3">
            {resultNoteSamples.map(({ status, statusNote }) => (
              <BillStatusBadge
                key={`${status}:${statusNote}`}
                status={status}
                statusNote={statusNote}
              />
            ))}
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
