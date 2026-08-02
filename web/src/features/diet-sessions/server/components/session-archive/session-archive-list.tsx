import {
  formatEraGroupHeading,
  groupDietSessionsByEraYear,
} from "../../../shared/utils/group-diet-sessions-by-era";
import type { SessionArchiveItem } from "../../loaders/get-session-archive";
import { SessionArchiveCard } from "./session-archive-card";

interface SessionArchiveListProps {
  items: SessionArchiveItem[];
}

/**
 * 会期一覧ページ（/sessions）のメインコンテンツ。
 * 会期を年度（令和N年）ごとにグルーピングし、開始日の新しい順に表示する
 */
export function SessionArchiveList({ items }: SessionArchiveListProps) {
  if (items.length === 0) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        表示できる会期がありません
      </p>
    );
  }

  const statsBySessionId = new Map(
    items.map((item) => [
      item.session.id,
      { billCount: item.billCount, splitVoteCount: item.splitVoteCount },
    ])
  );
  const groups = groupDietSessionsByEraYear(items.map((item) => item.session));

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-mirai-text">
            {formatEraGroupHeading(group)}
          </h2>
          {/* PC幅では2カラムにして縦スクロール量を減らす */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {group.sessions.map((session) => {
              const stats = statsBySessionId.get(session.id);
              return (
                <SessionArchiveCard
                  key={session.id}
                  session={session}
                  billCount={stats?.billCount ?? 0}
                  splitVoteCount={stats?.splitVoteCount ?? 0}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
