import { routes } from "@/lib/routes";

/** 検索結果に出さず、リンクはたどってよい、という指定 */
export const NOINDEX_FOLLOW = "noindex, follow";

/** 末尾のスラッシュは同じページとして扱う（/search/ も /search と同じ） */
function isSearchPath(pathname: string): boolean {
  return pathname === routes.search() || pathname === `${routes.search()}/`;
}

/** q が複数あるときは、どれか 1 つでも検索語（空白だけでない値）があれば検索結果とみなす */
function hasSearchTerm(searchParams: URLSearchParams): boolean {
  return searchParams.getAll("q").some((term) => term.trim() !== "");
}

/**
 * リクエストの URL から、X-Robots-Tag ヘッダーに付ける値を決める（付けないなら null）。
 *
 * 検索結果のページ（/search?q=…）は、入力した言葉の数だけ URL が増え、
 * 中身も検索窓だけの同じページなので、インデックスさせない。
 * ページ側の metadata では、クエリの有無でページを動的にしてしまう
 * （ISR で配信している静的ページでなくなる）ため、ミドルウェアのヘッダーで出し分ける。
 * クエリなしの /search は、検索ページとして通常どおりインデックスされる。
 * 検索語が空・空白（全角空白を含む）だけのときも、検索結果ではないので付けない
 */
export function getRobotsTagForRequest(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  if (isSearchPath(pathname) && hasSearchTerm(searchParams)) {
    return NOINDEX_FOLLOW;
  }
  return null;
}
