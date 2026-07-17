/**
 * 田川市議会「議員別の賛否」データ【田川市専用】
 *
 * 田川市議会は「賛否が分かれた案件」についてのみ、議員17名×会派ごとの
 * ○×表をPNG画像で議決結果ページに公開している
 * （例: https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png ）。
 * このファイルは、その画像から転記した賛否データを保持するためのRecordを提供する。
 *
 * キーは `{会期key}:{議案番号ラベル}`（例: "r5-6-teirei:議案第69号"）。
 * `source-data.ts` の `SessionSource.key` / `BillSource.billNumberLabel` と一致させること。
 *
 * データ本体は別途、画像からの転記作業で追記される（このファイルの新規作成時点では空）。
 * 捏造データを入れないこと。実データが無い議案はRecordにキーを追加しない
 * （bills.member_votes は null のままとなり、UI上のセクションは非表示になる）。
 *
 * CSVへの変換は `pnpm --filter @mirai-gikai/seed tagawa:build-csv`（build-csv.ts）が
 * `MEMBER_VOTES` を引いて bills.member_votes（jsonb）列に書き出す。
 */

/** 議員1名分の賛否 */
export type MemberVoteValue = "yes" | "no" | "absent" | "not_voting";
// yes=○賛成 / no=×反対 / absent=欠席 / not_voting=−（議長職務・除斥などで採決に加わらず）

export interface MemberVoteEntry {
  /** 議員名（姓、画像の表記どおり） */
  name: string;
  /** 会派名 */
  faction: string;
  vote: MemberVoteValue;
}

export interface MemberVotes {
  /** 出典のPNG画像URL */
  imageUrl: string;
  /** 掲載元の議決結果ページURL */
  sourceUrl: string;
  /** 画像下部の注記（議長は採決に加わらない等） */
  notes?: string[];
  entries: MemberVoteEntry[];
}

/**
 * 議員別賛否データ。キーは `{会期key}:{議案番号ラベル}`。
 *
 * データ追加はこのRecordに追記すること。
 * 例:
 * ```ts
 * "r5-6-teirei:議案第69号": {
 *   imageUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
 *   sourceUrl: "https://www.joho.tagawa.fukuoka.jp/...",
 *   notes: ["議長は採決に加わりません"],
 *   entries: [
 *     { name: "○○", faction: "○○会", vote: "yes" },
 *     ...
 *   ],
 * },
 * ```
 */
export const MEMBER_VOTES: Record<string, MemberVotes> = {
  // データ追加はこのRecordに追記する（実データ投入は別途のバッチ作業で行う）
};
