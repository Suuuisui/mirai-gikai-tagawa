// 議案カード用の動的カバー（BillCover）を構成するための純粋関数群。
// カテゴリ共通の静的サムネイル画像に代えて、議案ごとに見た目が
// 決定的に変化するカバーをCSS+アイコンで組み立てるために使用する。

/** 議案名冒頭の番号ラベルを検出する接頭辞（田川市議会の議案区分） */
const BILL_NUMBER_PREFIXES = [
  "議案",
  "認定",
  "報告",
  "承認",
  "発議",
  "意見書",
  "請願",
  "陳情",
  "諮問",
] as const;

const BILL_NUMBER_LABEL_PATTERN = new RegExp(
  `^(${BILL_NUMBER_PREFIXES.join("|")})第\\d+号`
);

/**
 * 議案名冒頭の番号ラベルを抽出する
 * 例: "議案第59号　令和元年度田川市一般会計補正予算（第3号）" → "議案第59号"
 * マッチしない場合は null を返す
 */
export function extractBillNumberLabel(name: string): string | null {
  const match = BILL_NUMBER_LABEL_PATTERN.exec(name);
  return match ? match[0] : null;
}

/**
 * 議案IDから決定的に 0〜variantCount-1 の数値を返す軽量ハッシュ
 * 同じIDであれば常に同じ結果を返す（文字コード和ベース）
 */
export function pickCoverVariant(billId: string, variantCount: number): number {
  if (variantCount <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < billId.length; i++) {
    sum += billId.charCodeAt(i);
  }
  return sum % variantCount;
}

/**
 * カテゴリ共通のデフォルトサムネイル画像（差し替え前の静的画像）かどうかを判定する
 * true の場合は BillCover（動的カバー）を表示し、false の場合は個別画像をそのまま表示する
 */
export function isDefaultThumbnail(url: string | null): boolean {
  return url === null || url.startsWith("/img/bill-thumbnails/");
}

const YEAR_MONTH_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  timeZone: "Asia/Tokyo",
});

/**
 * 提出日から「YYYY年M月」形式の文字列を返す
 * 和暦変換は行わず西暦表記とする。無効な日付の場合は空文字を返す
 */
export function formatSubmittedYearMonth(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return YEAR_MONTH_FORMAT.format(date);
}
