import { Captions, FileSearch, Landmark, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE_KINDS, type SourceKind } from "../data/source-kinds";

const KIND_ICONS: Record<SourceKind, LucideIcon> = {
  official: Landmark,
  transcript: Captions,
  disclosure: FileSearch,
};

const KIND_CLASS: Record<SourceKind, string> = {
  official: "border-source-official-border bg-source-official",
  transcript: "border-source-transcript-border bg-source-transcript",
  disclosure: "border-source-disclosure-border bg-source-disclosure",
};

interface SourceBadgeProps {
  kind: SourceKind;
  /** 何の資料か（例: 会議録検索システム）。省くと区分の名前だけを出す */
  detail?: string;
  className?: string;
}

/**
 * 情報のもと（出典）を示すバッジ。
 * サイト全体で同じ3区分（公式サイト・会議録／YouTube中継の文字起こし／情報開示請求の文書）を
 * 同じ色・アイコン・名前で示す。Server / Client のどちらからも使える
 */
export function SourceBadge({ kind, detail, className }: SourceBadgeProps) {
  const info = SOURCE_KINDS[kind];
  const Icon = KIND_ICONS[kind];
  return (
    <span
      data-source-kind={kind}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold leading-relaxed text-mirai-text-secondary",
        KIND_CLASS[kind],
        className
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">出典: </span>
      {detail ? (
        <span>
          {info.shortLabel}
          {/* 区切りの縦線は見た目だけ。読み上げでは読点にする */}
          <span aria-hidden>｜</span>
          <span className="sr-only">、</span>
          <span className="font-medium">{detail}</span>
        </span>
      ) : (
        info.label
      )}
    </span>
  );
}
