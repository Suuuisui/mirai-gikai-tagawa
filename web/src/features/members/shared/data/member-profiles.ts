/**
 * 田川市議会 議員プロフィール（姓→人物情報の手動対応表）【田川市専用】
 *
 * 議員別賛否データ（bills.member_votes）の姓表記をキーに、公式サイトの
 * 議員名簿から転記した人物情報を紐づける。捏造禁止。出典に無い項目は
 * undefined のままにすること。
 *
 * ## 出典（2026-02-25更新の公式名簿を2026-07-22に転記）
 * - 議員名簿（議席順）: https://www.joho.tagawa.fukuoka.jp/kiji003149/index.html
 *   （氏名・ふりがな・会派・当選回数）
 * - 議会構成（令和8年2月19日〜）: https://www.joho.tagawa.fukuoka.jp/kiji003280/index.html
 *   （議長・副議長・監査委員）
 * - 元議員のフルネーム: 議案説明資料PDF（bill-sponsors-data.ts の転記元）の
 *   提出者・賛成者欄
 *
 * ## 表記の注意
 * - キーの姓は member_votes / sponsors データの表記に合わせる
 *   （髙瀨ではなく髙瀬、村𠮷ではなく村吉、榊󠄀原ではなく榊原）。
 *   公式名簿側の異体字（村𠮷・榊󠄀原・高瀬）とは意図的に揃えていない
 * - 会派・役職・当選回数は名簿更新日時点のスナップショット。改選・辞職で
 *   変わるため、更新時は ROSTER_AS_OF も併せて更新すること
 * - 令和8年7月12日執行の市議補選で当選した議員は、公式名簿への反映を
 *   確認してから追加する（賛否データにもまだ登場しない）
 */

/** 公式名簿の基準日（名簿ページの更新日） */
export const ROSTER_AS_OF = "2026年2月25日";

export interface MemberProfile {
  /** フルネーム（姓 名、半角スペース区切り） */
  fullName: string;
  /** ふりがな */
  reading?: string;
  /** 名簿時点の会派 */
  faction?: string;
  /** 当選回数 */
  electedCount?: number;
  /** 名簿時点の役職（議長・副議長・監査委員） */
  role?: string;
  /** 現職か（名簿基準日時点） */
  isIncumbent: boolean;
  /** 補足（元議員の経歴等、出典で確認できる事実のみ） */
  note?: string;
}

/**
 * 姓（member_votesの表記）→ プロフィール。
 * 賛否データに登場する全25姓を収録（現職16・元議員9）
 */
export const MEMBER_PROFILES: Record<string, MemberProfile> = {
  // ── 現職（議員名簿〈議席順〉2026-02-25更新より） ──
  陸田: {
    fullName: "陸田 孝則",
    reading: "りくた たかのり",
    faction: "孔志会",
    electedCount: 6,
    role: "議長",
    isIncumbent: true,
  },
  田守: {
    fullName: "田守 健治",
    reading: "たもり けんじ",
    faction: "清友会",
    electedCount: 3,
    isIncumbent: true,
  },
  柿田: {
    fullName: "柿田 孝子",
    reading: "かきた たかこ",
    faction: "日本共産党市会議員団",
    electedCount: 5,
    isIncumbent: true,
  },
  佐藤: {
    fullName: "佐藤 俊一",
    reading: "さとう しゅんいち",
    faction: "日本共産党市会議員団",
    electedCount: 7,
    isIncumbent: true,
  },
  佐々木: {
    fullName: "佐々木 博",
    reading: "ささき ひろし",
    faction: "孔志会",
    electedCount: 2,
    isIncumbent: true,
  },
  山野: {
    fullName: "山野 義人",
    reading: "やまの よしひと",
    faction: "公明党",
    electedCount: 1,
    isIncumbent: true,
  },
  永松: {
    fullName: "永松 広宣",
    reading: "ながまつ ひろのり",
    faction: "公明党",
    electedCount: 1,
    isIncumbent: true,
  },
  村吉: {
    fullName: "村吉 勇介",
    reading: "むらよし ゆうすけ",
    faction: "シン・タガワ",
    electedCount: 1,
    role: "副議長",
    isIncumbent: true,
  },
  榊原: {
    fullName: "榊原 大祐",
    reading: "さかきばら だいすけ",
    faction: "シン・タガワ",
    electedCount: 1,
    role: "監査委員",
    isIncumbent: true,
  },
  尾﨑: {
    fullName: "尾﨑 行人",
    reading: "おざき ゆきひと",
    faction: "孔志会",
    electedCount: 4,
    isIncumbent: true,
  },
  髙瀬: {
    fullName: "髙瀬 冨士夫",
    reading: "たかせ ふじお",
    faction: "清友会",
    electedCount: 5,
    isIncumbent: true,
  },
  香月: {
    fullName: "香月 隆一",
    reading: "かつき りゅういち",
    faction: "社民党市議会議員団",
    electedCount: 8,
    isIncumbent: true,
  },
  石松: {
    fullName: "石松 和幸",
    reading: "いしまつ かずゆき",
    faction: "社民党市議会議員団",
    electedCount: 6,
    isIncumbent: true,
  },
  梶原: {
    fullName: "梶原 みつ子",
    reading: "かじわら みつこ",
    faction: "新風会",
    electedCount: 2,
    isIncumbent: true,
  },
  原田: {
    fullName: "原田 誠",
    reading: "はらだ まこと",
    faction: "新風会",
    electedCount: 3,
    isIncumbent: true,
  },
  小林: {
    fullName: "小林 義憲",
    reading: "こばやし よしのり",
    faction: "新風会",
    electedCount: 7,
    isIncumbent: true,
  },

  // ── 元議員（在任当時の賛否データに登場。フルネームは議案説明資料PDFより） ──
  今村: { fullName: "今村 寿人", isIncumbent: false },
  辻: { fullName: "辻 智之", isIncumbent: false },
  白石: { fullName: "白石 天一", isIncumbent: false },
  加藤: { fullName: "加藤 秀彦", isIncumbent: false },
  吉岡: { fullName: "吉岡 恭利", isIncumbent: false },
  梅林: { fullName: "梅林 史", isIncumbent: false },
  松岡: { fullName: "松岡 英樹", isIncumbent: false },
  北山: { fullName: "北山 隆之", isIncumbent: false },
  村上: {
    fullName: "村上 卓哉",
    isIncumbent: false,
    note: "のち田川市長に就任",
  },
};
