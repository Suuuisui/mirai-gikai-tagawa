"use client";

import { useEffect, useRef, useState } from "react";
import { shouldHideHeader } from "./should-hide-header";

/**
 * 下スクロールでヘッダーを隠し、上スクロールで再表示するためのフック。
 * 判定ロジックは shouldHideHeader（純粋関数）に分離している。
 */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      setHidden((wasHidden) => {
        const next = shouldHideHeader(lastYRef.current, currentY, wasHidden);
        lastYRef.current = currentY;
        return next;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
