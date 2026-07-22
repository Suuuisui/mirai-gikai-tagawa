"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { SearchItem } from "../../shared/types";
import { searchBills } from "../../shared/utils/search-bills";

interface SearchClientProps {
  items: SearchItem[];
}

export function SearchClient({ items }: SearchClientProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const results = useMemo(
    () => (trimmedQuery === "" ? [] : searchBills(items, query)),
    [items, query, trimmedQuery]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-mirai-text-muted" />
        <Input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例: 給食費、水道、防災 …"
          aria-label="議案をキーワードで検索"
          className="h-12 rounded-full border-mirai-border bg-white pl-11 text-sm"
        />
      </div>

      {trimmedQuery === "" ? (
        <p className="text-xs text-mirai-text-secondary">
          全{items.length}
          件の議案からキーワードで検索できます。議案名・概要・タグに含まれる言葉で絞り込めます。
        </p>
      ) : results.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 text-center">
          <p className="text-sm font-bold text-mirai-text">
            見つかりませんでした
          </p>
          <p className="text-xs leading-[1.8] text-mirai-text-secondary">
            気になる議案があれば、各議案ページのAIチャットに直接質問してみましょう。
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-mirai-text-secondary">
            {results.length}件
          </p>
          <div className="flex flex-col gap-3">
            {results.map((item) => (
              <Link key={item.id} href={routes.billDetail(item.id) as Route}>
                <Card className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-mirai-text-placeholder p-4 shadow-none transition-colors hover:bg-muted/50">
                  <h2 className="line-clamp-2 text-[15px] font-bold leading-[1.6] text-mirai-text">
                    {item.title}
                  </h2>
                  {item.submittedDate && (
                    <time className="text-xs text-mirai-text-muted">
                      {formatDateWithDots(item.submittedDate)} 議決
                    </time>
                  )}
                  {item.summary && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-mirai-text-secondary">
                      {item.summary}
                    </p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center justify-center rounded-full bg-mirai-surface-tag px-3 py-1 text-xs font-medium text-black"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
