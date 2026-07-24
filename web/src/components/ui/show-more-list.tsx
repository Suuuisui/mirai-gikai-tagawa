"use client";

import { Children, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

interface ShowMoreListProps {
  /** 最初に表示する件数 */
  initialCount: number;
  /** 「もっと見る」1回で追加表示する件数（省略時は残り全件） */
  step?: number;
  /** リストを包むラッパーのクラス（例: "flex flex-col gap-3"） */
  className?: string;
  children: ReactNode;
}

/**
 * 長いリストを段階表示する汎用ラッパー
 *
 * 子要素のうち initialCount 件だけを表示し、残りは「もっと見る」ボタンで
 * step 件ずつ（未指定なら一括で）追加表示する。全件がサーバーで
 * レンダリング済みのリストをクライアント側で出し分けるだけなので、
 * SEO・データ取得には影響しない。
 */
export function ShowMoreList({
  initialCount,
  step,
  className,
  children,
}: ShowMoreListProps) {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleItems = items.slice(0, visibleCount);
  const remaining = items.length - visibleItems.length;

  return (
    <>
      <div className={className}>{visibleItems}</div>
      {remaining > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              setVisibleCount((count) => count + (step ?? remaining))
            }
            className="h-12 min-w-[214px] rounded-full border-mirai-text bg-white text-base font-bold hover:bg-gray-50"
          >
            もっと見る（残り{remaining}件）
          </Button>
        </div>
      )}
    </>
  );
}
