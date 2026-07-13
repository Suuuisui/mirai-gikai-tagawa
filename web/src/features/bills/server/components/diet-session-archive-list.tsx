import { DietSessionCard } from "@/features/diet-sessions/server/components/diet-session-card";
import { groupDietSessionsByEraYear } from "@/features/diet-sessions/shared/utils/group-diet-sessions-by-era";
import type { DietSessionArchiveItem } from "../loaders/get-diet-session-archive";

interface DietSessionArchiveListProps {
  items: DietSessionArchiveItem[];
}

/**
 * 全会期一覧ページのメインコンテンツ
 * 会期を年度（令和N年）ごとにグルーピングして表示する
 */
export function DietSessionArchiveList({ items }: DietSessionArchiveListProps) {
  if (items.length === 0) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        表示できる会期がありません
      </p>
    );
  }

  const billCountBySessionId = new Map(
    items.map((item) => [item.session.id, item.billCount])
  );
  const groups = groupDietSessionsByEraYear(items.map((item) => item.session));

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-mirai-text">{group.label}</h2>
          <div className="flex flex-col gap-3">
            {group.sessions.map((session) => (
              <DietSessionCard
                key={session.id}
                session={session}
                billCount={billCountBySessionId.get(session.id) ?? 0}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
