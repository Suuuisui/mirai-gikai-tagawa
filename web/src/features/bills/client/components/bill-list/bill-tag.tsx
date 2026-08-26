import type { BillTag as BillTagType } from "../../../shared/types";

interface BillTagProps {
  tag: BillTagType;
}

export function BillTag({ tag }: BillTagProps) {
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-mirai-text-secondary bg-mirai-surface-tag rounded-md">
      {tag.label}
    </span>
  );
}
