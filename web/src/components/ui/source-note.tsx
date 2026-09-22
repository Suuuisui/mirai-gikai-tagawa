import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** ページ末尾の出典・注意書き（薄い色面にインフォアイコン付き） */
export function SourceNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
