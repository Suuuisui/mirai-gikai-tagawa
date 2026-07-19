import type { DietSession } from "../types";

export type DietSessionEraGroup = {
  /** 例: "令和8年" */
  label: string;
  sessions: DietSession[];
};

// "令和8年" のような数字表記に加え、元年（1年目）の "令和元年" 表記にも対応する
const ERA_YEAR_PATTERN = /^(令和(?:\d+|元)年)/;

/**
 * 会期名の先頭（例: "令和8年（第4回）6月定例会" → "令和8年"）から
 * 年度ラベルを取り出す。マッチしない場合は会期名全体をラベルとして扱う。
 */
function extractEraYearLabel(session: DietSession): string {
  const match = session.name.match(ERA_YEAR_PATTERN);
  return match ? match[1] : session.name;
}

/**
 * 会期一覧を年度（令和N年）ごとにグルーピングする。
 * 入力の並び順（例: start_date 降順）はグループ内・グループ間ともに維持される。
 */
export function groupDietSessionsByEraYear(
  sessions: DietSession[]
): DietSessionEraGroup[] {
  const groups: DietSessionEraGroup[] = [];
  const groupByLabel = new Map<string, DietSessionEraGroup>();

  for (const session of sessions) {
    const label = extractEraYearLabel(session);
    const existing = groupByLabel.get(label);

    if (existing) {
      existing.sessions.push(session);
      continue;
    }

    const group: DietSessionEraGroup = { label, sessions: [session] };
    groupByLabel.set(label, group);
    groups.push(group);
  }

  return groups;
}

/**
 * 会期年度グループの見出しラベルを「2026年（令和8年）」の形式で組み立てる。
 * 西暦はグループ内先頭会期（start_dateが最も新しい会期）の start_date から求める。
 * グループは groupDietSessionsByEraYear により必ず1件以上の会期を持つ。
 */
export function formatEraGroupHeading(group: DietSessionEraGroup): string {
  const firstSession = group.sessions[0];
  const year = new Date(firstSession.start_date).getFullYear();
  return `${year}年（${group.label}）`;
}
