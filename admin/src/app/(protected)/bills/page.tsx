import { BillList } from "@/features/bills/server/components/bill-list/bill-list";
import { parseBillListFilter } from "@/features/bills/shared/utils/parse-bill-list-filter";
import { parseBillSortParams } from "@/features/bills/shared/utils/parse-bill-sort-params";

interface BillsPageProps {
  searchParams: Promise<{
    sort?: string;
    order?: string;
    dietSession?: string;
  }>;
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const { sort, order, dietSession } = await searchParams;
  const sortConfig = parseBillSortParams(sort, order);
  const filter = parseBillListFilter({ dietSession });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">議案管理</h1>
        <p className="text-gray-600 mt-1">議案の一覧を確認・管理できます</p>
      </div>

      <BillList sortConfig={sortConfig} filter={filter} />
    </div>
  );
}
