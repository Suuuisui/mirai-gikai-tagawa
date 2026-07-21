/**
 * 配列を指定サイズごとの小配列に分割する。
 * Supabaseの `.in()` に大量のIDを渡すとクエリ文字列がURI長制限を超えるため、
 * ID一括取得系のリポジトリ関数で分割リクエストに使う
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error(`chunk size must be positive: ${size}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
