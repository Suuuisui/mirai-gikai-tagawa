/**
 * "YYYY-MM-DD" 形式の日付文字列を「YYYY年M月」表記にする。
 * 形式が想定外の場合は入力をそのまま返す
 */
export function formatYearMonth(date: string): string {
  const match = date.match(/^(\d{4})-(\d{2})/);
  if (!match) {
    return date;
  }
  return `${match[1]}年${Number(match[2])}月`;
}
