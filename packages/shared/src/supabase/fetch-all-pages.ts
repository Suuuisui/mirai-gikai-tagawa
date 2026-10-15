/**
 * Supabase (PostgREST) は1回の応答を max_rows（既定1000）で黙って打ち切る。
 * 全件が要る一覧は、範囲を区切って最後まで取得する。
 *
 * 使い方（並びが一意になるよう、呼び出し側で .order(..., "id" など) を付けること）:
 *   const { data, error } = await fetchAllPages((from, to) =>
 *     supabase.from("bills").select("*").order("id").range(from, to)
 *   );
 */
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = SUPABASE_PAGE_SIZE
): Promise<PageResult<T>> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) return { data: all, error: null };
  }
}
