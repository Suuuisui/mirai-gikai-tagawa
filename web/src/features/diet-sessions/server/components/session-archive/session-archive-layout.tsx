import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import type { SessionArchiveItem } from "../../loaders/get-session-archive";
import { SessionArchiveList } from "./session-archive-list";

interface SessionArchiveLayoutProps {
  items: SessionArchiveItem[];
}

/**
 * 会期一覧ページ（/sessions）本体。
 * 全ての会期まとめページ（/sessions/[id]）への入り口を年度ごとに一覧表示する
 */
export function SessionArchiveLayout({ items }: SessionArchiveLayoutProps) {
  return (
    <div className="bg-mirai-surface-muted">
      <Container className="py-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb
            items={[
              { label: "TOP", href: routes.home() },
              { label: "議会ごとのまとめ" },
            ]}
          />

          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold leading-[1.4] text-mirai-text">
              議会ごとのまとめ
            </h1>
            <p className="text-sm font-medium text-mirai-text-muted">
              田川市議会の全ての会期を新しい順に一覧できます。会期を選ぶと、その会期に提出された議案の集計・ハイライトのまとめを見ることができます。
            </p>
          </header>

          <SessionArchiveList items={items} />
        </div>
      </Container>
    </div>
  );
}
