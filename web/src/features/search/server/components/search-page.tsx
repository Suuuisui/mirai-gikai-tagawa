import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { routes } from "@/lib/routes";
import { SearchClient } from "../../client/components/search-client";
import { buildSearchItems } from "../../shared/utils/build-search-items";

/**
 * 議案をキーワードで検索するページ
 *
 * 検索対象データはgetBills()（キャッシュ済み）から軽量化して作り、
 * 実際の絞り込みはSearchClient（Client Component）側で行う
 */
export async function SearchPage() {
  const bills = await getBills();
  const items = buildSearchItems(bills);

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-1.5 pb-8">
          <h1 className="text-[22px] font-bold text-black leading-[1.48]">
            議案を検索
          </h1>
          <p className="text-xs text-mirai-text-secondary">
            気になるキーワードで、田川市議会に提出された議案をさがせます。
          </p>
        </div>

        <SearchClient items={items} />
      </Container>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "TOP", href: routes.home() },
            { label: "議案を検索" },
          ]}
        />
      </Container>
    </div>
  );
}
