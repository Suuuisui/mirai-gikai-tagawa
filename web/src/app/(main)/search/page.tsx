import type { Metadata } from "next";
import { SearchPage } from "@/features/search/server/components/search-page";

export const metadata: Metadata = {
  title: "議案を検索",
  description:
    "田川市議会に提出された議案をキーワードで検索できます。議案名・概要・タグに含まれる言葉で絞り込めます。",
};

export default function Page() {
  return <SearchPage />;
}
