import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DietSessionArchiveList } from "@/features/bills/server/components/diet-session-archive-list";
import { getDietSessionArchive } from "@/features/bills/server/loaders/get-diet-session-archive";
import { routes } from "@/lib/routes";

// ISR: データ更新時は /api/revalidate（revalidateTag）で即時反映され、
// 会期バナー等の日付起因の表示は最長10分で追従する
export const revalidate = 600;

export const metadata = {
  title: "田川市議会 会期一覧",
  description:
    "田川市議会の全ての会期を一覧で確認できます。会期を選ぶと、その会期に提出された議案の一覧を見ることができます。",
  alternates: {
    canonical: routes.archive(),
  },
};

export default async function DietSessionArchivePage() {
  const items = await getDietSessionArchive();

  return (
    <div data-wide-column>
      {/* ページタイトル（薄青の色面） */}
      <div className="bg-mirai-surface-key md:rounded-lg">
        <Container className="py-8">
          <h1 className="text-2xl font-bold text-mirai-text">会期一覧</h1>
          <p className="mt-1 text-sm text-mirai-text-muted">
            田川市議会の全ての会期
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <DietSessionArchiveList items={items} />
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <Breadcrumb
          items={[{ label: "TOP", href: routes.home() }, { label: "会期一覧" }]}
        />
      </Container>
    </div>
  );
}
