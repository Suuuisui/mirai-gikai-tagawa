/** 元号の開始日（新しい順）。ISO 日付の文字列比較でどの元号かを判定する */
const ERAS = [
  { name: "令和", start: "2019-05-01", firstYear: 2019 },
  { name: "平成", start: "1989-01-08", firstYear: 1989 },
  { name: "昭和", start: "1926-12-25", firstYear: 1926 },
] as const;

/**
 * "YYYY-MM-DD" を和暦の日付にする（例: 2026-10-08 → 令和8年10月8日）。
 * 元年は「元年」と書く。昭和より前の日付や、日付として読めない入力は null。
 * 時刻付きの文字列（2026-10-08T00:00:00Z）は日付の部分だけを使う
 */
export function formatJapaneseEraDate(isoDate: string): string | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const era = ERAS.find(
    (candidate) => `${match[1]}-${match[2]}-${match[3]}` >= candidate.start
  );
  if (!era) return null;

  const eraYear = year - era.firstYear + 1;
  const yearLabel = eraYear === 1 ? "元" : String(eraYear);
  return `${era.name}${yearLabel}年${month}月${day}日`;
}
