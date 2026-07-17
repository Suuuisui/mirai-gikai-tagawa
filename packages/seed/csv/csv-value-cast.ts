/**
 * CSV → jsonbカラム向けの値変換ロジック（`import-csv.ts` の `readCsv` から使用）。
 *
 * 外部依存（DB・ファイルI/O）を持たない純粋関数として切り出すことで、
 * `import-csv.ts`（実行と同時にDBへ接続する副作用を持つ）を経由せずに
 * テストできるようにする。
 */

/**
 * JSON配列文字列をPostgreSQL配列形式に変換する
 * 例: '["a","b","c"]' -> '{a,b,c}'
 *
 * オブジェクトを含む配列（例: bills.explanation_material_urls のような
 * jsonbカラム向けの '[{"label":...,"url":...}]'）はPostgreSQL配列ではなく
 * JSONとして挿入する必要があるため、パース済みの配列をそのまま返す
 * （supabase-jsがjsonbとしてシリアライズする）
 */
export function convertJsonArrayToPostgresArray(
  value: string
): string | unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.some((item) => typeof item === "object" && item !== null)) {
        return parsed;
      }
      const escaped = parsed.map((item) => {
        const str = String(item);
        // カンマ、ダブルクォート、バックスラッシュ、中括弧、空白を含む場合はクォート
        if (/[,"\\\{\}\s]/.test(str)) {
          return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        }
        return str;
      });
      return `{${escaped.join(",")}}`;
    }
  } catch {
    // JSON解析に失敗した場合は元の値を返す
  }
  return value;
}

/**
 * jsonbオブジェクトのCSV文字列（例: bills.member_votes のような
 * '{"imageUrl":...,"entries":[...]}' 形式）をパース済みのオブジェクトに変換する。
 * パースせず文字列のまま渡すと、supabase-jsがJSON文字列自体をjsonb値として
 * 二重にシリアライズしてしまう（jsonb列にJSON文字列がスカラー値として
 * 保存され、オブジェクトとして扱えなくなる）ため、ここで一度パースしておく
 */
export function convertJsonObjectValue(
  value: string
): string | Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  } catch {
    // JSON解析に失敗した場合は元の値を返す
  }
  return value;
}

/**
 * csv-parseの`cast`コールバックから呼び出す統合エントリポイント。
 * 空文字はnull、JSON配列/オブジェクト形式の文字列は変換し、それ以外は
 * そのまま返す
 */
export function castCsvValue(value: string): unknown {
  if (value === "") return null;
  if (value.startsWith("[") && value.endsWith("]")) {
    return convertJsonArrayToPostgresArray(value);
  }
  if (value.startsWith("{") && value.endsWith("}")) {
    return convertJsonObjectValue(value);
  }
  return value;
}
