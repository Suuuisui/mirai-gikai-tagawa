/**
 * 田川市議会「議員別の賛否」データ【田川市専用】
 *
 * 田川市議会は「賛否が分かれた案件」についてのみ、議員17名×会派ごとの
 * ○×表をPNG画像で議決結果ページに公開している
 * （例: https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png ）。
 * このファイルは、その画像から転記した賛否データを保持するためのRecordを提供する。
 *
 * キーは `{会期key}:{議案番号ラベル}:{proposer}`（例: "r5-6-teirei:議案第69号:mayor"）。
 * `source-data.ts` の `SessionSource.key` / `BillSource.billNumberLabel` / `proposer` と
 * 一致させること。proposerを含めるのは、会期によっては市長提出と議員提出で同じ
 * 議案番号が使われ衝突するため（例: r7-6の議案第44号）。
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
 * 議員別賛否データ。キーは `{会期key}:{議案番号ラベル}:{proposer}`。
 *
 * データ追加はこのRecordに追記すること。
 * 例:
 * ```ts
 * "r5-6-teirei:議案第69号:mayor": {
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
// 以下のデータは田川市議会公式サイトの「賛否が分かれた案件」PNG画像
// （各会期の議決結果ページ掲載）から転記したもの（2026-07-17〜18作業、
// 全27会期・121議案。画像内の賛成/反対合計と転記カウントの突合検証済み）。
// 無記名投票の議案（議長不信任決議など7件）は議員別データが公開されて
// いないため収録していない。
export const MEMBER_VOTES: Record<string, MemberVotes> = {
  "r3-1-teirei:議案第18号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第20号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第25号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第26号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第27号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第28号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第6号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第7号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:議案第8号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-1-teirei:陳情第2号:committee": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19243_up_plzq7tq5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "no"
      }
    ]
  },
  "r3-2-rinji:議案第30号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037344/3_7344_20196_up_7zackpx3.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037344/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、賛否が分かれることなく可決されました。北山議員は議長のため採決には加わりません。"
    ],
    "entries": [
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      }
    ]
  },
  "r3-4-teirei:議案第13号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21755_up_rem80ga0.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/index.html",
    "notes": [
      "議案第33号は2回採決されている: (1)柿田議員ら提出の修正案（オリンピック・パラリンピックキャンプ地誘致推進事業費を削減）→ 賛成7反対12で否決、(2)その後の原案 → 賛成12反対7で可決。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r3-4-teirei:議案第33号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21755_up_rem80ga0.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/index.html",
    "notes": [
      "議案第33号は2回採決されている: (1)柿田議員ら提出の修正案（オリンピック・パラリンピックキャンプ地誘致推進事業費を削減）→ 賛成7反対12で否決、(2)その後の原案 → 賛成12反対7で可決。",
      "この議案では「令和3年度田川市一般会計補正予算（修正案）［提出：柿田、賛成：佐藤、梶原、北山］補正予算のうち、オリンピック・パラリンピックキャンプ地誘致推進事業費を削減する修正案」の採決（賛成7・反対12）も行われました。上の表は「令和3年度田川市一般会計補正予算（原案）」の採決結果です。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-4-teirei:議案第39号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21755_up_rem80ga0.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/index.html",
    "notes": [
      "議案第33号は2回採決されている: (1)柿田議員ら提出の修正案（オリンピック・パラリンピックキャンプ地誘致推進事業費を削減）→ 賛成7反対12で否決、(2)その後の原案 → 賛成12反対7で可決。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-4-teirei:議案第40号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21755_up_rem80ga0.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/index.html",
    "notes": [
      "議案第33号は2回採決されている: (1)柿田議員ら提出の修正案（オリンピック・パラリンピックキャンプ地誘致推進事業費を削減）→ 賛成7反対12で否決、(2)その後の原案 → 賛成12反対7で可決。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-5-teirei:認定第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23043_up_1cauyd0d.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わりません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-5-teirei:議案第48号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23043_up_1cauyd0d.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わりません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r3-5-teirei:議案第55号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23043_up_1cauyd0d.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わりません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r3-5-teirei:議案第56号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23043_up_1cauyd0d.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わりません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-5-teirei:議案第57号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23043_up_1cauyd0d.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わりません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-6-teirei:議案第16号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-6-teirei:議案第17号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "not_voting"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-6-teirei:議案第18号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "not_voting"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-6-teirei:議案第19号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "not_voting"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r3-6-teirei:議案第20号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "not_voting"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r3-6-teirei:議案第60号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r3-6-teirei:議案第63号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24135_up_akk6jcy5.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第17号と19号では、小林議長が除斥となり、髙瀬議員（令和クラブ）が議長を務めたため、髙瀬議員はこの2件の採決に加わっていません（表内「－」）。",
      "凡例: ○＝賛成、×＝反対、欠＝欠席、除＝除斥。欠・除は賛成/反対の分母（賛成+反対の合計）に含まれない。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r4-1-teirei:議案第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037954/3_7954_25665_up_oajbbwwp.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037954/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r4-2-teirei:報告第3号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/3_8052_27741_up_kro5senh.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第24号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内賛成9・反対9は議員の票のみ。議長裁決は表に反映されていない）。",
      "除斥: 地方自治法第117条により、議会の議員は、自身に直接関係する案件の議事に加われません。その議事の際は退席しています（議案第24号で北山議員が除斥）。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "absent"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      }
    ]
  },
  "r4-2-teirei:議案第24号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/3_8052_27741_up_kro5senh.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議案第24号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内賛成9・反対9は議員の票のみ。議長裁決は表に反映されていない）。",
      "除斥: 地方自治法第117条により、議会の議員は、自身に直接関係する案件の議事に加われません。その議事の際は退席しています（議案第24号で北山議員が除斥）。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "not_voting"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:認定第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:認定第2号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:認定第3号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:議案第26号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r4-3-teirei:議案第40号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:議案第44号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:議案第46号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-3-teirei:議案第49号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29091_up_uaydgygj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r4-4-teirei:議案第27号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30870_up_qbkn4rhw.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議員提出議案第27号及び第28号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内の賛成9・反対9は議員票のみ）。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "清友",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友",
        "vote": "no"
      }
    ]
  },
  "r4-4-teirei:議案第28号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30870_up_qbkn4rhw.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議員提出議案第27号及び第28号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内の賛成9・反対9は議員票のみ）。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "清友",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友",
        "vote": "no"
      }
    ]
  },
  "r4-4-teirei:議案第54号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30870_up_qbkn4rhw.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議員提出議案第27号及び第28号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内の賛成9・反対9は議員票のみ）。",
      "この議案では「令和4年度田川市一般会計補正予算（修正案）［提出：柿田、賛成：佐藤］予算のうち、マイナンバーカード交付促進事業費を削減する修正案」の採決（賛成5・反対13）も行われました。上の表は「令和4年度田川市一般会計補正予算（原案）」の採決結果です。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友",
        "vote": "yes"
      }
    ]
  },
  "r4-4-teirei:議案第57号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30870_up_qbkn4rhw.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/index.html",
    "notes": [
      "会派名: 令和＝令和クラブ、社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団、緑友＝緑友会",
      "上記以外の案件は、全会一致で可決されました。小林議員（緑友会）は議長であるため、採決に加わっていません。",
      "議員提出議案第27号及び第28号では、可否同数となり、地方自治法第116条第1項により、議長裁決によって、可決となりました（表内の賛成9・反対9は議員票のみ）。"
    ],
    "entries": [
      {
        "name": "北山",
        "faction": "令和",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "令和",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "白石",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "吉岡",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "加藤",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "公明改革クラブ",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "梅林",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "松岡",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "村上",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "緑友",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "清友",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友",
        "vote": "yes"
      }
    ]
  },
  "r5-3-teirei:議案第33号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33888_up_bgiilpaq.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/index.html",
    "notes": [
      "会派構成が大きく変化（R4→R5にかけて）。新会派名: シン・タガワ（榊原,村吉,辻）、新風会（原田,梶原,小林）、清風会（尾﨑,佐々木）、孔志会（今村,陸田）、黎明会（山野,永松）、清友会（田守,髙瀬）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決（議案第55号の再議を除く）に加わっていません。",
      "議案第33号は2回に分けて採決: (1)小林議員提出の修正案（国際交流推進事業費を削減）→ 賛成9反対8で可決、(2)修正部分を除く原案 → 賛成15反対2で可決。結果として議案第33号全体は「修正議決」。",
      "この議案では「令和5年度田川市一般会計補正予算（修正案）［提出：小林、賛成：原田］補正予算のうち、国際交流推進事業費を削減する修正案」の採決（賛成9・反対8）も行われました。上の表は「令和5年度田川市一般会計補正予算（修正部分を除く原案）」の採決結果です。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-3-teirei:議案第36号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33888_up_bgiilpaq.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/index.html",
    "notes": [
      "会派構成が大きく変化（R4→R5にかけて）。新会派名: シン・タガワ（榊原,村吉,辻）、新風会（原田,梶原,小林）、清風会（尾﨑,佐々木）、孔志会（今村,陸田）、黎明会（山野,永松）、清友会（田守,髙瀬）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決（議案第55号の再議を除く）に加わっていません。",
      "議案第33号は2回に分けて採決: (1)小林議員提出の修正案（国際交流推進事業費を削減）→ 賛成9反対8で可決、(2)修正部分を除く原案 → 賛成15反対2で可決。結果として議案第33号全体は「修正議決」。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-3-teirei:議案第49号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33888_up_bgiilpaq.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/index.html",
    "notes": [
      "会派構成が大きく変化（R4→R5にかけて）。新会派名: シン・タガワ（榊原,村吉,辻）、新風会（原田,梶原,小林）、清風会（尾﨑,佐々木）、孔志会（今村,陸田）、黎明会（山野,永松）、清友会（田守,髙瀬）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決（議案第55号の再議を除く）に加わっていません。",
      "議案第33号は2回に分けて採決: (1)小林議員提出の修正案（国際交流推進事業費を削減）→ 賛成9反対8で可決、(2)修正部分を除く原案 → 賛成15反対2で可決。結果として議案第33号全体は「修正議決」。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-3-teirei:議案第4号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33888_up_bgiilpaq.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/index.html",
    "notes": [
      "会派構成が大きく変化（R4→R5にかけて）。新会派名: シン・タガワ（榊原,村吉,辻）、新風会（原田,梶原,小林）、清風会（尾﨑,佐々木）、孔志会（今村,陸田）、黎明会（山野,永松）、清友会（田守,髙瀬）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決（議案第55号の再議を除く）に加わっていません。",
      "議案第33号は2回に分けて採決: (1)小林議員提出の修正案（国際交流推進事業費を削減）→ 賛成9反対8で可決、(2)修正部分を除く原案 → 賛成15反対2で可決。結果として議案第33号全体は「修正議決」。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r5-4-rinji:議案第55号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33888_up_bgiilpaq.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/index.html",
    "notes": [
      "議案第55号は市長提出議案で、6月定例会で修正議決（減額）された議案第33号の補正予算に対し、市長が地方自治法第176条に基づく再議を申し入れたもの。(1)修正可決に対する再議＝地方自治法176条3項に基づく特別多数決（出席議員の3分の2以上の賛成が必要、議長を含む）→ 賛成6反対12で再議不成立（3分の2に届かず、修正議決のままでは維持できず）、(2)その結果を受けて議案第33号の原案（修正前の市長原案）を改めて採決 → 賛成14反対2で可決。",
      "(1)の特別多数決では議長（陸田議員・孔志会）も採決に加わっている（通常の議決とは異なり議長も投票）。(2)の原案採決では陸田議員は議長として不参加（－）。",
      "この議案では「議案第33号令和5年度田川市一般会計補正予算に対する再議について（修正可決に対する審議）」の採決（賛成6・反対12）も行われました。上の表は「令和5年度田川市一般会計補正予算（原案）」の採決結果です。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-5-teirei:認定第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35527_up_73nnvymj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r5-5-teirei:議案第56号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35527_up_73nnvymj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "absent"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-5-teirei:議案第5号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35527_up_73nnvymj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r5-5-teirei:議案第64号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35527_up_73nnvymj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "absent"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-5-teirei:議案第7号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35527_up_73nnvymj.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r5-6-teirei:議員提出議案第10号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第8号と第12号では、陸田議長が除斥（地方自治法第117条により、自身に直接関係する案件の議事に加わらず、その間は退席）となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの2件の採決に加わっていません（votesでは\"not_voting\"として記載）。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "孔志",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-6-teirei:議員提出議案第12号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第8号と第12号では、陸田議長が除斥（地方自治法第117条により、自身に直接関係する案件の議事に加わらず、その間は退席）となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの2件の採決に加わっていません（votesでは\"not_voting\"として記載）。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-6-teirei:議員提出議案第8号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第8号と第12号では、陸田議長が除斥（地方自治法第117条により、自身に直接関係する案件の議事に加わらず、その間は退席）となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの2件の採決に加わっていません（votesでは\"not_voting\"として記載）。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "孔志",
        "vote": "absent"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r5-6-teirei:議案第69号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第8号と第12号では、陸田議長が除斥（地方自治法第117条により、自身に直接関係する案件の議事に加わらず、その間は退席）となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの2件の採決に加わっていません（votesでは\"not_voting\"として記載）。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志",
        "vote": "absent"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r5-6-teirei:議案第74号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37988_up_0lm2gdy1.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/index.html",
    "notes": [
      "会派名: 社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団（画像内に明記）。",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第8号と第12号では、陸田議長が除斥（地方自治法第117条により、自身に直接関係する案件の議事に加わらず、その間は退席）となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの2件の採決に加わっていません（votesでは\"not_voting\"として記載）。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志",
        "vote": "absent"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-1-teirei:議員提出議案第11号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "absent"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-1-teirei:議員提出議案第13号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-1-teirei:議員提出議案第14号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-1-teirei:議員提出議案第15号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "absent"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-1-teirei:議員提出議案第16号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "not_voting"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "absent"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-1-teirei:議案第21号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_39108_up_c6c0yy2p.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第11号・第13号・第15号・第16号では、陸田議員が除斥となり、梶原副議長（新風会）が議長を務めたため、梶原副議長はこの4件の採決に加わっていません。",
      "除斥：地方自治法第117条により、議会の議長と議員は、自身に直接関係する案件の議事に加わりません。その議事の間は退席しています。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-2-teirei:報告第4号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40372_up_lhy2nrst.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "absent"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-2-teirei:議員提出議案第17号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40372_up_lhy2nrst.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-2-teirei:議員提出議案第20号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40372_up_lhy2nrst.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-2-teirei:議案第36号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40372_up_lhy2nrst.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:認定第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第22号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第23号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第24号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第25号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第26号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第27号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r6-3-teirei:議案第44号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第53号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第54号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第55号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第56号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第57号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-3-teirei:議案第58号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44129_up_67h60v4g.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第62号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第63号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第64号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第65号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第66号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-4-rinji:議案第67号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/3_10831_44128_up_q2nseoxb.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310831/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "absent"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r6-5-teirei:議案第71号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310826/3_10826_44130_up_174a5jwl.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310826/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "absent"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "absent"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-1-teirei:議案第16号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-1-teirei:議案第33号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-1-teirei:議案第34号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-1-teirei:議案第37号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-1-teirei:議案第39号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-1-teirei:議案第6号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45616_up_1yv1ib0k.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決されました。議員提出議案第38号以外は、陸田議員（孔志会）は、議長であるため採決に加わっていません。",
      "議員提出議案第38号、第40号は協議の結果無記名投票となったため、議員別の賛否はわかりません。",
      "議員提出議案第38号は特別多数議決のため、出席議員の4分の3（13人）以上の賛成をもって可決となります。",
      "本会期から陸田議員（孔志会、議長）も表内の会派『孔志会』の列として掲載されるようになった（採決に加わらない案件では『－』表記）。会派構成・議員はr6-5以前と同じ。",
      "この議案では「令和7年度田川市一般会計予算（修正案）」の採決（賛成7・反対9）も行われました。上の表は「令和7年度田川市一般会計予算」の採決結果です。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "no"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "今村",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-2-rinji:報告第3号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311087/3_11087_46608_up_2xxd6x60.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311087/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "議員提出議案第41号以外は、陸田議員は議長であるため採決に加わっていません。",
      "議員提出議案第41号は特別多数議決のため、出席議員の4分の3（14人）以上の賛成をもって可決となります。協議の結果、無記名投票による採決となったため議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "清風会",
        "vote": "yes"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "今村",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "山野",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "黎明会",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-6-teirei:認定第1号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第41号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-6-teirei:議案第45号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第46号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第49号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第50号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第51号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第54号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-6-teirei:議案第55号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49619_up_k6ljtnlr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議案第44号（議員提出議案第44号）は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案第44号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "no"
      }
    ]
  },
  "r7-7-teirei:議員提出議案第53号:member": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r7-7-teirei:議案第59号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-7-teirei:議案第60号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-7-teirei:議案第61号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-7-teirei:議案第62号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r7-7-teirei:議案第73号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r7-7-teirei:議案第75号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r7-7-teirei:議案第76号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "no"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r7-7-teirei:議案第77号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50343_up_j8dqhpcs.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（議案第74号を含む）は、全会一致で可決されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。",
      "議員提出議案第52号は、陸田議員は除斥（※）となり、辻議員は副議長として議長の職務を行ったため、採決に加わっていません。",
      "除斥：議会の審議を公正に行うため、審議する案件に利害関係がある議員はその審議に参加できないこと。",
      "議員提出議案52号は協議の結果無記名投票となったため、議員別の賛否はわかりません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "辻",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "absent"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "yes"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "no"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "no"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r8-2-teirei:議案第14号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51785_up_vbd5lcwr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r8-2-teirei:議案第16号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51785_up_vbd5lcwr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r8-2-teirei:議案第17号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51785_up_vbd5lcwr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r8-2-teirei:議案第8号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51785_up_vbd5lcwr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r8-2-teirei:議案第9号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51785_up_vbd5lcwr.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
  "r8-3-rinji:報告第3号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311747/3_11747_53255_up_kwoup1go.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311747/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件（報告第2号・第4号、市長の退職の期日に関する同意について）は、全会一致で承認・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "yes"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "yes"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "absent"
      }
    ]
  },
  "r8-4-teirei:議案第42号:mayor": {
    "imageUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311782/3_11782_54292_up_ezdtvuyu.png",
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311782/index.html",
    "notes": [
      "会派名：社民党＝社民党市議会議員団、共産党＝日本共産党市会議員団",
      "上記以外の案件は、全会一致で可決・同意されました。陸田議員（孔志会）は議長であるため、採決に加わっていません。"
    ],
    "entries": [
      {
        "name": "榊原",
        "faction": "シン・タガワ",
        "vote": "yes"
      },
      {
        "name": "村吉",
        "faction": "シン・タガワ",
        "vote": "no"
      },
      {
        "name": "香月",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "石松",
        "faction": "社民党",
        "vote": "no"
      },
      {
        "name": "原田",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "梶原",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "小林",
        "faction": "新風会",
        "vote": "no"
      },
      {
        "name": "佐藤",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "柿田",
        "faction": "共産党",
        "vote": "no"
      },
      {
        "name": "尾﨑",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "陸田",
        "faction": "孔志会",
        "vote": "not_voting"
      },
      {
        "name": "佐々木",
        "faction": "孔志会",
        "vote": "yes"
      },
      {
        "name": "山野",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "永松",
        "faction": "公明党",
        "vote": "yes"
      },
      {
        "name": "田守",
        "faction": "清友会",
        "vote": "yes"
      },
      {
        "name": "髙瀬",
        "faction": "清友会",
        "vote": "yes"
      }
    ]
  },
};
