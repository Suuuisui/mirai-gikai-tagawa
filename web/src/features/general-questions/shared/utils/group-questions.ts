import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";

/** 会期内の1日分（質問日ごとのまとまり） */
export interface QuestionDayGroup {
  /** 質問日（YYYY-MM-DD。不明なら null） */
  date: string | null;
  dayIndex: number | null;
  records: GeneralQuestionRecord[];
}

/** 会期1つ分の一般質問 */
export interface QuestionSessionGroup {
  sessionKey: string;
  sessionName: string;
  /** 最初の質問日（並べ替えと期間表示に使う） */
  firstDate: string | null;
  lastDate: string | null;
  days: QuestionDayGroup[];
  records: GeneralQuestionRecord[];
}

/** 順番の昇順に並べたコピーを返す */
function sortByOrder(records: readonly GeneralQuestionRecord[]) {
  return [...records].sort((a, b) => a.order - b.order);
}

/**
 * 会期キー（r8-6-teirei / h29-1-teirei）を「新しい順」に比べる。
 * 文字列比較だと r10 が r9 より前に来るため、元号・年・回を数値で比べる
 */
export function compareSessionKeysDesc(a: string, b: string): number {
  const parse = (key: string) => {
    const m = key.match(/^([hr])(\d+)-(\d+)/);
    if (!m) return [0, 0, 0];
    return [m[1] === "r" ? 1 : 0, Number(m[2]), Number(m[3])];
  };
  const [eraA, yearA, roundA] = parse(a);
  const [eraB, yearB, roundB] = parse(b);
  return eraB - eraA || yearB - yearA || roundB - roundA || b.localeCompare(a);
}

/**
 * 一般質問の記録を会期ごとにまとめ、新しい会期が先頭に来るよう並べる。
 * 会期内は質問日（1日目・2日目…）ごとに分け、日付が不明な記録は末尾にまとめる
 */
export function groupQuestionsBySession(
  records: readonly GeneralQuestionRecord[]
): QuestionSessionGroup[] {
  const bySession = new Map<string, GeneralQuestionRecord[]>();
  for (const record of records) {
    const list = bySession.get(record.sessionKey);
    if (list) {
      list.push(record);
    } else {
      bySession.set(record.sessionKey, [record]);
    }
  }

  const groups = Array.from(bySession.entries()).map(([sessionKey, list]) => {
    const ordered = sortByOrder(list);
    const dates = ordered
      .map((record) => record.questionDate)
      .filter((date): date is string => date !== null)
      .sort();
    return {
      sessionKey,
      sessionName: ordered[0].sessionName,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null,
      days: groupByDay(ordered),
      records: ordered,
    };
  });

  return groups.sort(
    (a, b) =>
      (b.firstDate ?? "").localeCompare(a.firstDate ?? "") ||
      compareSessionKeysDesc(a.sessionKey, b.sessionKey)
  );
}

/** 質問日ごとにまとめ、日付順に並べる（不明な日付は末尾） */
function groupByDay(
  records: readonly GeneralQuestionRecord[]
): QuestionDayGroup[] {
  const byDate = new Map<string | null, QuestionDayGroup>();
  for (const record of records) {
    const day = byDate.get(record.questionDate);
    if (day) {
      day.records.push(record);
    } else {
      byDate.set(record.questionDate, {
        date: record.questionDate,
        dayIndex: record.dayIndex,
        records: [record],
      });
    }
  }
  return [...byDate.values()].sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date.localeCompare(b.date);
  });
}

/** 特定の会期の一般質問（順番順）。無ければ空配列 */
export function selectQuestionsForSession(
  records: readonly GeneralQuestionRecord[],
  sessionKey: string | null
): GeneralQuestionRecord[] {
  if (!sessionKey) return [];
  return sortByOrder(
    records.filter((record) => record.sessionKey === sessionKey)
  );
}

/** 照合用に空白を除いた氏名（榊原 大祐 → 榊原大祐） */
export function compactMemberName(name: string): string {
  return name.replace(/\s+/g, "");
}

/**
 * 特定の議員の一般質問を新しい順に返す。
 * 姓だけでは同姓の別人（例: 髙瀬冨士夫と髙瀬春美）が混ざるため、
 * フルネームが分かっている場合はそれも一致する記録に絞る
 */
export function selectQuestionsByMember(
  records: readonly GeneralQuestionRecord[],
  member: { familyName: string; fullName: string | null }
): GeneralQuestionRecord[] {
  const fullName = member.fullName ? compactMemberName(member.fullName) : null;
  return records
    .filter(
      (record) =>
        record.familyName === member.familyName &&
        (fullName === null || compactMemberName(record.memberName) === fullName)
    )
    .sort(
      (a, b) =>
        (b.questionDate ?? "").localeCompare(a.questionDate ?? "") ||
        compareSessionKeysDesc(a.sessionKey, b.sessionKey) ||
        a.order - b.order
    );
}

/** 「1日目（9月9日）」のような日付見出し。日付が不明なら「日程未確認」 */
export function formatQuestionDayLabel(
  day: Pick<QuestionDayGroup, "date" | "dayIndex">
): string {
  if (!day.date) return "日程未確認";
  const [, month, dayOfMonth] = day.date.split("-");
  const dateLabel = `${Number(month)}月${Number(dayOfMonth)}日`;
  return day.dayIndex ? `${day.dayIndex}日目（${dateLabel}）` : dateLabel;
}

/** 「9月9日〜11日」のような会期の質問期間。日付が無ければ「日程未確認」 */
export function formatQuestionPeriod(
  group: Pick<QuestionSessionGroup, "firstDate" | "lastDate">
): string {
  if (!group.firstDate) return "日程未確認";
  const toLabel = (date: string, withMonth: boolean) => {
    const [, month, day] = date.split("-");
    return withMonth
      ? `${Number(month)}月${Number(day)}日`
      : `${Number(day)}日`;
  };
  if (!group.lastDate || group.lastDate === group.firstDate) {
    return toLabel(group.firstDate, true);
  }
  const sameMonth = group.firstDate.slice(0, 7) === group.lastDate.slice(0, 7);
  return `${toLabel(group.firstDate, true)}〜${toLabel(group.lastDate, !sameMonth)}`;
}

/** 質問事項の総数（議員ごとの項目数の合計） */
export function countQuestionItems(
  records: readonly GeneralQuestionRecord[]
): number {
  return records.reduce((sum, record) => sum + record.items.length, 0);
}

/** 会期ページ内で議員1人の質問を指すアンカーid */
export function questionAnchorId(
  record: Pick<GeneralQuestionRecord, "order">
): string {
  return `q-${record.order}`;
}
