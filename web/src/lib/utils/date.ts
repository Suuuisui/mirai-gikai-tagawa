const jstLongDateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});

const jstNumericDateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
});

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return jstLongDateFormat.format(date);
}

/**
 * 日付をドット区切り形式でフォーマット (例: 2025.10.1)
 * ゼロ埋めなし
 */
export function formatDateWithDots(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return jstNumericDateFormat.format(date).replaceAll("/", ".");
}

/**
 * 日本時間の現在時刻を返す
 */
export function getJapanTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
}

/**
 * DateオブジェクトをYYYY-MM-DD形式に変換する（DBの日付列との比較用）。
 * getJapanTime() が返すDateはローカルgetterがJST基準の値を返すため、
 * ここでも同様にローカルgetterを使う。
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
