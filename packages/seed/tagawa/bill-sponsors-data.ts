/**
 * 田川市議会「議員・委員会提出議案の提出者・賛成者」データ【田川市専用】
 *
 * 田川市公式サイト「提出議案と議決結果」ページに掲載されている議案説明資料
 * PDFの冒頭（かがみ文）には、議員提出議案・委員会提出議案について
 * 「提出者」「賛成者」の氏名（フルネーム）が記載されている。
 * このファイルは、そのPDFから転記した提出者・賛成者データを保持する。
 *
 * キーは `{会期key}:{議案番号ラベル}:{proposer}`（member-votes-data.ts と同形式。
 * 例: "r3-4-teirei:議案第11号:member"）。`source-data.ts` の
 * `SessionSource.key` / `BillSource.billNumberLabel` / `proposer` と一致させること。
 *
 * 転記規約:
 * - 氏名はPDFの表記どおり（髙・﨑などの異体字を保持）。姓と名の間に半角スペース1つ
 *   （例: "髙瀬 冨士夫"）。姓名の区切りが判定できない場合はスペースなしで全体を記載
 * - 委員会提出議案で「提出者 ○○委員会 委員長 □□」のような肩書がある場合は
 *   `title` に肩書（例: "総務文教委員会委員長"）、`name` に氏名を入れる
 * - 賛成者の記載が無いPDFでは `supporters` は空配列
 * - **捏造データを入れないこと。** PDFが判読できない議案はRecordにキーを追加しない
 *   （bills.sponsors は null のままとなり、UI上は非表示になる）
 *
 * CSVへの変換は `pnpm --filter @mirai-gikai/seed tagawa:build-csv`（build-csv.ts）が
 * `BILL_SPONSORS` を引いて bills.sponsors（jsonb）列に書き出す。
 */

/** 提出者・賛成者1名分 */
export interface SponsorPerson {
  /** 氏名（姓と名の間に半角スペース。例: "髙瀬 冨士夫"） */
  name: string;
  /** 肩書（委員会提出議案の「○○委員会委員長」等。議員個人の場合は省略） */
  title?: string;
}

export interface BillSponsors {
  /** 提出者（通常1名。共同提出の場合は複数） */
  proposers: SponsorPerson[];
  /** 賛成者（連署議員）。記載が無い場合は空配列 */
  supporters: SponsorPerson[];
  /** 出典のPDF URL（田川市公式サイト） */
  sourceUrl: string;
}

/**
 * 提出者・賛成者データ。キーは `{会期key}:{議案番号ラベル}:{proposer}`
 */
export const BILL_SPONSORS: Record<string, BillSponsors> = 
// 以下のデータは田川市公式サイト掲載の議案説明資料PDF（かがみ文）から転記したもの
// （2026-07-22作業、89議案。転記後に元PDFとの抜き打ち照合を実施済み）。
// r7-6-teirei:議案第45号:member は公式サイト掲載PDFが別議案（市長提出の市税条例
// 改正）の内容だったため収録していない。
{
  "r1-5-teirei:議案第5号:member": {
    "proposers": [
      {
        "name": "田守 健治"
      }
    ],
    "supporters": [
      {
        "name": "髙瀬 冨士夫"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "加藤 秀彦"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0036592/3_6592_13822_up_0ntagwhz.pdf"
  },
  "r1-5-teirei:議案第6号:member": {
    "proposers": [
      {
        "name": "田守 健治"
      }
    ],
    "supporters": [
      {
        "name": "髙瀬 冨士夫"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "加藤 秀彦"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0036592/3_6592_13821_up_z672sz5a.pdf"
  },
  "r3-1-teirei:議案第2号:committee": {
    "proposers": [
      {
        "name": "佐藤 俊一",
        "title": "厚生委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037279/3_7279_19659_up_586lmmlt.pdf"
  },
  "r3-4-teirei:議案第4号:committee": {
    "proposers": [
      {
        "name": "柿田 孝子",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21703_up_7r6pxmk7.pdf"
  },
  "r3-4-teirei:議案第11号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21706_up_2i466eyo.pdf"
  },
  "r3-4-teirei:議案第12号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21704_up_zo23n7w0.pdf"
  },
  "r3-4-teirei:議案第13号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "北山 隆之"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037497/3_7497_21705_up_m4a8yipx.pdf"
  },
  "r3-5-teirei:議案第5号:committee": {
    "proposers": [
      {
        "name": "柿田 孝子",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23008_up_11c4dw1c.pdf"
  },
  "r3-5-teirei:議案第14号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23009_up_yelj4zj6.pdf"
  },
  "r3-5-teirei:議案第15号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037638/3_7638_23205_up_cbs3qyiz.pdf"
  },
  "r3-6-teirei:議案第16号:member": {
    "proposers": [
      {
        "name": "陸田 孝則"
      }
    ],
    "supporters": [
      {
        "name": "田守 健治"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "尾﨑 行人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24118_up_bqedw8bp.pdf"
  },
  "r3-6-teirei:議案第17号:member": {
    "proposers": [
      {
        "name": "梅林 史"
      }
    ],
    "supporters": [
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "松岡 英樹"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24119_up_cdsr1z5i.pdf"
  },
  "r3-6-teirei:議案第18号:member": {
    "proposers": [
      {
        "name": "梅林 史"
      }
    ],
    "supporters": [
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "松岡 英樹"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24120_up_nt51j2zu.pdf"
  },
  "r3-6-teirei:議案第19号:member": {
    "proposers": [
      {
        "name": "石松 和幸"
      }
    ],
    "supporters": [
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "白石 天一"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24121_up_ylr508in.pdf"
  },
  "r3-6-teirei:議案第20号:member": {
    "proposers": [
      {
        "name": "石松 和幸"
      }
    ],
    "supporters": [
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "白石 天一"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037791/3_7791_24122_up_d7onodlg.pdf"
  },
  "r4-1-teirei:議案第21号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037954/3_7954_25660_up_0zmnxonq.pdf"
  },
  "r4-1-teirei:議案第22号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037954/3_7954_25940_up_ro7m42m8.pdf"
  },
  "r4-1-teirei:議案第6号:committee": {
    "proposers": [
      {
        "name": "佐藤 俊一",
        "title": "厚生委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0037954/3_7954_25941_up_esl7wptx.pdf"
  },
  "r4-2-teirei:議案第23号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "田守 健治"
      },
      {
        "name": "梶原 みつ子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/3_8052_27715_up_huyx8pmo.pdf"
  },
  "r4-2-teirei:議案第24号:member": {
    "proposers": [
      {
        "name": "香月 隆一"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "白石 天一"
      },
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038052/3_8052_27716_up_b5z2jhg8.pdf"
  },
  "r4-3-teirei:議案第7号:committee": {
    "proposers": [
      {
        "name": "柿田 孝子",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_28955_up_du42ld3e.pdf"
  },
  "r4-3-teirei:議案第25号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "今村 寿人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29195_up_xl1hgu4o.pdf"
  },
  "r4-3-teirei:議案第26号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "村上 卓哉"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "北山 隆之"
      },
      {
        "name": "白石 天一"
      },
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038225/3_8225_29196_up_na7gr6eb.pdf"
  },
  "r4-4-teirei:議案第8号:committee": {
    "proposers": [
      {
        "name": "柿田 孝子",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30853_up_t7hmr1pe.pdf"
  },
  "r4-4-teirei:議案第27号:member": {
    "proposers": [
      {
        "name": "村上 卓哉"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "北山 隆之"
      },
      {
        "name": "白石 天一"
      },
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30854_up_uq5ici45.pdf"
  },
  "r4-4-teirei:議案第28号:member": {
    "proposers": [
      {
        "name": "村上 卓哉"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "北山 隆之"
      },
      {
        "name": "白石 天一"
      },
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038363/3_8363_30855_up_pask23t5.pdf"
  },
  "r5-1-teirei:議案第9号:committee": {
    "proposers": [
      {
        "name": "柿田 孝子",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038446/3_8446_32002_up_yu532uh3.pdf"
  },
  "r5-1-teirei:議案第10号:committee": {
    "proposers": [
      {
        "name": "佐藤 俊一",
        "title": "厚生委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038446/3_8446_32003_up_w0olm6pk.pdf"
  },
  "r5-1-teirei:議案第29号:member": {
    "proposers": [
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "supporters": [
      {
        "name": "北山 隆之"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "陸田 孝則"
      },
      {
        "name": "吉岡 恭利"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "今村 寿人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038446/3_8446_32004_up_pig3r3pi.pdf"
  },
  "r5-3-teirei:議案第1号:committee": {
    "proposers": [
      {
        "name": "石松 和幸",
        "title": "建設経済委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33823_up_zy7ci2m1.pdf"
  },
  "r5-3-teirei:議案第2号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33709_up_30i3ghio.pdf"
  },
  "r5-3-teirei:議案第3号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33710_up_rbnr7ly6.pdf"
  },
  "r5-3-teirei:議案第4号:member": {
    "proposers": [
      {
        "name": "小林 義憲"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038597/3_8597_33711_up_p6a2xa8k.pdf"
  },
  "r5-5-teirei:議案第5号:member": {
    "proposers": [
      {
        "name": "香月 隆一"
      }
    ],
    "supporters": [
      {
        "name": "田守 健治"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35346_up_gsbmtutv.pdf"
  },
  "r5-5-teirei:議案第6号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35347_up_p3zqkvz8.pdf"
  },
  "r5-5-teirei:議案第7号:member": {
    "proposers": [
      {
        "name": "柿田 孝子"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji0038719/3_8719_35348_up_o6s4sq4n.pdf"
  },
  "r5-6-teirei:議員提出議案第8号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37157_up_71yovmjl.pdf"
  },
  "r5-6-teirei:議員提出議案第9号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37158_up_1soskblp.pdf"
  },
  "r5-6-teirei:議員提出議案第10号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37159_up_gmncxlso.pdf"
  },
  "r5-6-teirei:議員提出議案第11号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "石松 和幸"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37160_up_z06xga2o.pdf"
  },
  "r5-6-teirei:議員提出議案第12号:member": {
    "proposers": [
      {
        "name": "今村 寿人"
      }
    ],
    "supporters": [
      {
        "name": "佐々木 博"
      },
      {
        "name": "尾﨑 行人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310134/3_10134_37438_up_v7sj2ie6.pdf"
  },
  "r6-1-teirei:議員提出議案第11号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "石松 和幸"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38728_up_azdq6g12.pdf"
  },
  "r6-1-teirei:委員会提出議案第2号:committee": {
    "proposers": [
      {
        "name": "佐々木 博",
        "title": "田川市議会議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38840_up_kbd00emo.pdf"
  },
  "r6-1-teirei:議員提出議案第13号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "石松 和幸"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38727_up_7o6jde5g.pdf"
  },
  "r6-1-teirei:議員提出議案第14号:member": {
    "proposers": [
      {
        "name": "今村 寿人"
      }
    ],
    "supporters": [
      {
        "name": "田守 健治"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38729_up_8spahmgt.pdf"
  },
  "r6-1-teirei:議員提出議案第15号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38685_up_lnlbvrns.pdf"
  },
  "r6-1-teirei:議員提出議案第16号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "香月 隆一"
      },
      {
        "name": "柿田 孝子"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310303/3_10303_38686_up_l5krgee4.pdf"
  },
  "r6-2-teirei:議員提出議案第17号:member": {
    "proposers": [
      {
        "name": "香月 隆一"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "原田 誠"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40341_up_xcl75l2b.pdf"
  },
  "r6-2-teirei:議員提出議案第18号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40342_up_cgnqy7di.pdf"
  },
  "r6-2-teirei:議員提出議案第19号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40343_up_rhrgoei7.pdf"
  },
  "r6-2-teirei:議員提出議案第20号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310473/3_10473_40344_up_sdae51la.pdf"
  },
  "r6-3-teirei:議案第21号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44045_up_upz6k8ic.pdf"
  },
  "r6-3-teirei:議案第22号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44046_up_udrano5r.pdf"
  },
  "r6-3-teirei:議案第23号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44047_up_ja0hhyo2.pdf"
  },
  "r6-3-teirei:議案第24号:member": {
    "proposers": [
      {
        "name": "香月 隆一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44048_up_3ps4w4rt.pdf"
  },
  "r6-3-teirei:議案第25号:member": {
    "proposers": [
      {
        "name": "香月 隆一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44049_up_5oyw8wi7.pdf"
  },
  "r6-3-teirei:議案第26号:member": {
    "proposers": [
      {
        "name": "榊原 大祐"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44050_up_c85j0dux.pdf"
  },
  "r6-3-teirei:議案第27号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "辻 智之"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310825/3_10825_44051_up_czcp5w0b.pdf"
  },
  "r7-1-teirei:議案第28号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "村吉 勇介"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45562_up_31v8xc7o.pdf"
  },
  "r7-1-teirei:議案第30号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45582_up_n6ypr5v4.pdf"
  },
  "r7-1-teirei:議案第31号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45583_up_ke6bdra4.pdf"
  },
  "r7-1-teirei:議案第32号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45584_up_qu1iijc1.pdf"
  },
  "r7-1-teirei:議案第33号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "香月 隆一"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45585_up_1vu5rti2.pdf"
  },
  "r7-1-teirei:議案第34号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "香月 隆一"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45586_up_87duxz38.pdf"
  },
  "r7-1-teirei:議案第35号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45587_up_dwz8u5hv.pdf"
  },
  "r7-1-teirei:議案第36号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45588_up_ec5qhvdm.pdf"
  },
  "r7-1-teirei:議案第37号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "石松 和幸"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45589_up_u4m5tukm.pdf"
  },
  "r7-1-teirei:議案第38号:member": {
    "proposers": [
      {
        "name": "今村 寿人"
      }
    ],
    "supporters": [
      {
        "name": "佐々木 博"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "尾﨑 行人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45590_up_rtq6ks52.pdf"
  },
  "r7-1-teirei:議案第39号:member": {
    "proposers": [
      {
        "name": "尾﨑 行人"
      }
    ],
    "supporters": [
      {
        "name": "佐々木 博"
      },
      {
        "name": "今村 寿人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45591_up_h82usg7q.pdf"
  },
  "r7-1-teirei:議案第40号:member": {
    "proposers": [
      {
        "name": "佐々木 博"
      }
    ],
    "supporters": [
      {
        "name": "永松 広宣"
      },
      {
        "name": "尾﨑 行人"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00310997/3_10997_45592_up_tvawvxpe.pdf"
  },
  "r7-2-rinji:議案第41号:member": {
    "proposers": [
      {
        "name": "尾﨑 行人"
      }
    ],
    "supporters": [
      {
        "name": "田守 健治"
      },
      {
        "name": "佐々木 博"
      },
      {
        "name": "山野 義人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "今村 寿人"
      },
      {
        "name": "髙瀬 冨士夫"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311087/3_11087_46534_up_14whxj3w.pdf"
  },
  "r7-3-rinji:議案第3号:committee": {
    "proposers": [
      {
        "name": "佐々木 博",
        "title": "議会運営委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311090/3_11090_46557_up_p70eutg7.pdf"
  },
  "r7-3-rinji:議案第42号:member": {
    "proposers": [
      {
        "name": "柿田 孝子"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311090/3_11090_46558_up_miz33mxa.pdf"
  },
  "r7-5-rinji:議案第43号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311181/3_11181_47393_up_2oolvrcs.pdf"
  },
  "r7-6-teirei:議案第44号:member": {
    "proposers": [
      {
        "name": "梶原 みつ子"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49537_up_t2lixsit.pdf"
  },
  "r7-6-teirei:議案第46号:member": {
    "proposers": [
      {
        "name": "榊原 大祐"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49578_up_02kt7zia.pdf"
  },
  "r7-6-teirei:議案第4号:committee": {
    "proposers": [
      {
        "name": "村吉 勇介",
        "title": "厚生委員会委員長"
      }
    ],
    "supporters": [],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49579_up_i7ct8c3e.pdf"
  },
  "r7-6-teirei:議案第47号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49580_up_8rldwnzb.pdf"
  },
  "r7-6-teirei:議案第48号:member": {
    "proposers": [
      {
        "name": "辻 智之"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49581_up_uavsbhs2.pdf"
  },
  "r7-6-teirei:議案第49号:member": {
    "proposers": [
      {
        "name": "柿田 孝子"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49582_up_iha3gp78.pdf"
  },
  "r7-6-teirei:議案第50号:member": {
    "proposers": [
      {
        "name": "柿田 孝子"
      }
    ],
    "supporters": [
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49583_up_s6ybivu2.pdf"
  },
  "r7-6-teirei:議案第51号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311415/3_11415_49584_up_q70eddh8.pdf"
  },
  "r7-7-teirei:議員提出議案第52号:member": {
    "proposers": [
      {
        "name": "榊原 大祐"
      }
    ],
    "supporters": [
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50167_up_yhli3g6g.pdf"
  },
  "r7-7-teirei:議員提出議案第53号:member": {
    "proposers": [
      {
        "name": "佐藤 俊一"
      }
    ],
    "supporters": [
      {
        "name": "柿田 孝子"
      },
      {
        "name": "村吉 勇介"
      },
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "石松 和幸"
      },
      {
        "name": "梶原 みつ子"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "小林 義憲"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311472/3_11472_50268_up_4kr8q7gy.pdf"
  },
  "r8-2-teirei:議案第54号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51782_up_y3s1voym.pdf"
  },
  "r8-2-teirei:議案第55号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51783_up_rtwb3hsc.pdf"
  },
  "r8-2-teirei:議案第56号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311615/3_11615_51784_up_vbsxcqq3.pdf"
  },
  "r8-4-teirei:議案第57号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311782/3_11782_54282_up_uvqszmlm.pdf"
  },
  "r8-4-teirei:議案第58号:member": {
    "proposers": [
      {
        "name": "村吉 勇介"
      }
    ],
    "supporters": [
      {
        "name": "榊原 大祐"
      },
      {
        "name": "香月 隆一"
      },
      {
        "name": "原田 誠"
      },
      {
        "name": "佐藤 俊一"
      },
      {
        "name": "尾﨑 行人"
      },
      {
        "name": "永松 広宣"
      },
      {
        "name": "田守 健治"
      }
    ],
    "sourceUrl": "https://www.joho.tagawa.fukuoka.jp/kiji00311782/3_11782_54283_up_btyr8sys.pdf"
  }
};
