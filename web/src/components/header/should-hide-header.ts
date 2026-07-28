/** ヘッダーを隠す判定を始めるスクロール量（ヒーローに重なる前は常に表示） */
export const HIDE_SCROLL_THRESHOLD = 160;

/** スクロールのガタつき（慣性スクロールの揺り戻し等）を無視する最小移動量 */
export const SCROLL_DELTA_THRESHOLD = 8;

/**
 * スクロール位置の変化から、固定ヘッダーを隠すべきかを判定する純粋関数。
 *
 * - 下方向へのスクロール中（かつページ上部を離れている）は隠す
 * - 上方向へのスクロールで再表示する
 * - 微小な移動では直前の状態を維持し、表示がちらつかないようにする
 */
export function shouldHideHeader(
  previousY: number,
  currentY: number,
  wasHidden: boolean
): boolean {
  // iOSのオーバースクロールで負値になることがあるため0未満は0として扱う
  const prev = Math.max(previousY, 0);
  const current = Math.max(currentY, 0);

  // ページ上部付近では常に表示する
  if (current < HIDE_SCROLL_THRESHOLD) {
    return false;
  }

  const delta = current - prev;
  if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
    return wasHidden;
  }

  return delta > 0;
}
