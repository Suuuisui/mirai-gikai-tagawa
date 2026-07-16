/**
 * 再シード（`clearAllData()` による全消し→CSV再投入）で
 * interview_configs / interview_questions が消えてしまう問題への対応。
 *
 * CSVには interview系のデータが無い（田川市版では対象外のため常に0件）ため、
 * クリア前に「会期slug + 議案名」をキーとして既存データをスナップショットし、
 * インポート後に新しい bill_id へ付け替えて復元する。
 *
 * 決定的UUID化（uuidv5、build-csv.ts参照）により通常は bill_id が変わらなく
 * なるが、ID体系の移行時や議案名の修正時にも耐えられるよう、名前ベースの
 * 復元を用意しておく。bill.name は単独では全議案を通して一意ではない
 * （同じ議案名が異なる会期に再度提出されるケースがある）ため、
 * 会期slugと組み合わせて一意なマッチングキーとする。
 *
 * ここでは Supabase 等の外部依存を持たない純粋関数のみを扱う。
 * 実際のDBアクセス（スナップショット取得・復元INSERT）は import-csv.ts 側で行う。
 */

export interface BillInfo {
  id: string;
  name: string;
  diet_session_id: string | null;
}

export interface SessionInfo {
  id: string;
  slug: string;
}

export interface InterviewConfigRow {
  id: string;
  bill_id: string;
  chat_model: string | null;
  created_at: string;
  deleted_at: string | null;
  estimated_duration: number | null;
  mode: string;
  name: string;
  status: string;
  themes: string[] | null;
  updated_at: string;
}

export interface InterviewQuestionRow {
  id: string;
  interview_config_id: string;
  created_at: string;
  follow_up_guide: string | null;
  question: string;
  question_order: number;
  quick_replies: string[] | null;
  target_audience: string | null;
  updated_at: string;
}

export interface InterviewConfigSnapshot extends InterviewConfigRow {
  /** 「会期slug::議案名」形式のマッチングキー。対応する議案が見つからなければnull */
  billMatchKey: string | null;
}

export interface RestoreConfigsResult {
  restored: InterviewConfigRow[];
  skipped: Array<{ id: string; name: string; reason: string }>;
}

/** 「会期slug::議案名」形式の一意なマッチングキーを作る */
export function billMatchKey(sessionSlug: string, billName: string): string {
  return `${sessionSlug}::${billName}`;
}

function buildSessionSlugById(sessions: SessionInfo[]): Map<string, string> {
  return new Map(sessions.map((s) => [s.id, s.slug]));
}

/** bill_id -> billMatchKey の対応表を作る（クリア前のスナップショット付与用） */
export function buildBillIdToMatchKey(
  bills: BillInfo[],
  sessions: SessionInfo[]
): Map<string, string> {
  const sessionSlugById = buildSessionSlugById(sessions);
  const map = new Map<string, string>();
  for (const bill of bills) {
    const slug = bill.diet_session_id
      ? sessionSlugById.get(bill.diet_session_id)
      : undefined;
    if (!slug) continue;
    map.set(bill.id, billMatchKey(slug, bill.name));
  }
  return map;
}

/** billMatchKey -> 新しいbill_id の対応表を作る（インポート後の新データから復元先を解決する用） */
export function buildMatchKeyToBillId(
  bills: BillInfo[],
  sessions: SessionInfo[]
): Map<string, string> {
  const sessionSlugById = buildSessionSlugById(sessions);
  const map = new Map<string, string>();
  for (const bill of bills) {
    const slug = bill.diet_session_id
      ? sessionSlugById.get(bill.diet_session_id)
      : undefined;
    if (!slug) continue;
    map.set(billMatchKey(slug, bill.name), bill.id);
  }
  return map;
}

/** クリア前の interview_configs 各行に billMatchKey を付与する */
export function attachBillMatchKeys(
  configs: InterviewConfigRow[],
  billIdToMatchKey: Map<string, string>
): InterviewConfigSnapshot[] {
  return configs.map((config) => ({
    ...config,
    billMatchKey: billIdToMatchKey.get(config.bill_id) ?? null,
  }));
}

/**
 * スナップショットを新しい bill_id へ付け替える。
 * - billMatchKey が null（クリア前時点で既に対応する議案が見つからなかった）→ スキップ
 * - 新データ側に一致する議案が無い（議案名や会期が変わった等）→ スキップ
 */
export function resolveRestoredConfigs(
  snapshots: InterviewConfigSnapshot[],
  matchKeyToNewBillId: Map<string, string>
): RestoreConfigsResult {
  const restored: InterviewConfigRow[] = [];
  const skipped: RestoreConfigsResult["skipped"] = [];

  for (const snapshot of snapshots) {
    const { billMatchKey: matchKey, ...config } = snapshot;
    if (!matchKey) {
      skipped.push({
        id: config.id,
        name: config.name,
        reason: "クリア前の時点で紐づく議案が見つかりませんでした（データ不整合）",
      });
      continue;
    }
    const newBillId = matchKeyToNewBillId.get(matchKey);
    if (!newBillId) {
      skipped.push({
        id: config.id,
        name: config.name,
        reason: `会期・議案名が一致する新データが見つかりませんでした（${matchKey}）`,
      });
      continue;
    }
    restored.push({ ...config, bill_id: newBillId });
  }

  return { restored, skipped };
}

/** 復元された config に紐づく questions のみを残す（親configが復元できなかった分は捨てる） */
export function filterQuestionsForRestoredConfigs(
  questions: InterviewQuestionRow[],
  restoredConfigIds: ReadonlySet<string>
): InterviewQuestionRow[] {
  return questions.filter((q) => restoredConfigIds.has(q.interview_config_id));
}
