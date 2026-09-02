/**
 * 田川市長の特設ページに載せる固定情報【田川市専用】
 *
 * 捏造禁止。公式サイト・公式の投開票速報・当サイトの委員会記録で確認できる
 * 事実だけを載せる。出典に無い項目（出身地・家族など）は載せない。
 * 市長が代わったときに直す固有名詞・日付はすべてこのファイルに集める。
 *
 * ## 出典
 * - 市長プロフィール（2026-07-13更新）:
 *   https://www.joho.tagawa.fukuoka.jp/kiji0033669/index.html
 * - 令和8年7月12日執行 田川市長選挙及び田川市議会議員補欠選挙「投・開票速報」:
 *   https://www.joho.tagawa.fukuoka.jp/kiji00311845/index.html
 * - 就任までの経緯: 当サイトの委員会記録（committee_meetings）の見出し
 */

export interface MayorProfile {
  /** 姓 名（半角スペース区切り） */
  name: string;
  reading: string;
  /** YYYY-MM-DD */
  birthDate: string;
  /** 就任日（YYYY-MM-DD）。この日以降の記録・議案を「新市長の動き」として扱う */
  inaugurationDate: string;
  term: string;
  /** 公式プロフィールの記載順 */
  career: readonly string[];
  officialProfileUrl: string;
  /** 転記元の公式プロフィールの更新日（表示用） */
  profileAsOf: string;
}

export const MAYOR_PROFILE: MayorProfile = {
  name: "浦野 仁",
  reading: "うらの じん",
  birthDate: "1995-06-24",
  inaugurationDate: "2026-07-13",
  term: "1期目",
  career: [
    "福岡県立田川高等学校卒業",
    "旅館、飲食店、小売業など多様な職種に従事",
    "北九州市立大学法学部在学中に学習塾「夢塾」を起業",
    "夢塾を田川市内3校舎と福岡市の計4校舎に拡大",
    "米国ボストンの大学院（HULT）でMIB（国際経営学修士）を修了",
  ],
  officialProfileUrl:
    "https://www.joho.tagawa.fukuoka.jp/kiji0033669/index.html",
  profileAsOf: "2026年7月13日",
};

/**
 * 会議の要点から「現市長に関わるもの」を拾うための語。
 * 要点（committee_meetings.key_points）は素の文字列配列で主語の構造を
 * 持たないため、取り込み側で構造を持たせるまでの暫定として表示層で選別する。
 * exclude は前市長についてだけ述べた要点を落とすためのもの。
 * include は「副市長」にも当たるが、副市長の選任は新市長の動きなので意図して含める
 */
export const MAYOR_POINT_PATTERNS = {
  include: /浦野|市長/,
  exclude: /前市長|元市長|村上/,
} as const;

export interface ElectionCandidate {
  /** 公式速報の表記（ひらがな表記の候補者はそのまま） */
  name: string;
  votes: number;
  /** 新人／前職／元職 */
  status: "新" | "前" | "元";
  elected: boolean;
}

export interface ElectionResult {
  /** 執行日（YYYY-MM-DD） */
  date: string;
  reason: string;
  candidates: readonly ElectionCandidate[];
  sourceUrl: string;
}

/** 令和8年7月12日執行 田川市長選挙 */
export const MAYORAL_ELECTION: ElectionResult = {
  date: "2026-07-12",
  reason: "前市長の退職に伴う選挙",
  candidates: [
    { name: "浦野 仁", votes: 8345, status: "新", elected: true },
    { name: "ふたば 公人", votes: 4637, status: "元", elected: false },
    { name: "村上 たくや", votes: 4232, status: "前", elected: false },
    { name: "佐々木 まこと", votes: 3399, status: "新", elected: false },
  ],
  sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311845/index.html",
};

export interface ByElectionResult {
  seats: number;
  candidates: readonly ElectionCandidate[];
}

/** 同日執行の田川市議会議員補欠選挙（欠員2） */
export const COUNCIL_BY_ELECTION: ByElectionResult = {
  seats: 2,
  candidates: [
    { name: "いまむら 寿人", votes: 6913, status: "元", elected: true },
    { name: "せら 翔二郎", votes: 5103, status: "新", elected: true },
    { name: "清田 こうへい", votes: 3587, status: "新", elected: false },
    { name: "白石 てんいち", votes: 3192, status: "元", elected: false },
  ],
};

/** タイムラインの出典。会議・議案は名前で持ち、IDはローダーが一覧から引く */
export type TimelineSource =
  | { kind: "meeting"; committeeName: string; meetingDate: string }
  | { kind: "bill"; billName: string }
  | { kind: "official"; url: string; label: string };

export interface TimelineEvent {
  date: string;
  title: string;
  /** 出典の見出し・記載の範囲で書く（推測を足さない） */
  description: string;
  source: TimelineSource;
}

/**
 * 前市長の問題が表面化してから新市長就任までの経緯。
 * title/description は各出典（委員会記録の見出し等）の範囲内に留める
 */
export const ROAD_TO_INAUGURATION: readonly TimelineEvent[] = [
  {
    date: "2025-02-19",
    title: "前市長の公務出張問題が表面化",
    description:
      "全員協議会で市長が公務出張中の不倫を認め、辞職は否定したうえで報酬の30%削減を表明しました。",
    source: {
      kind: "meeting",
      committeeName: "全員協議会",
      meetingDate: "2025-02-19",
    },
  },
  {
    date: "2025-03-19",
    title: "市長の給料5割減額条例が可決",
    description:
      "総務文教委員会で減額条例を可決。「問題の幕引きは許さない」との討論もありました。同日の議会運営委員会では不信任決議・百条委員会設置・辞職勧告の扱いを協議しています。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2025-03-19",
    },
  },
  {
    date: "2025-04-30",
    title: "市長不信任決議案を臨時会で採決",
    description:
      "市民からは起立採決の要望が出ましたが、採決方法は無記名投票に決まりました。",
    source: {
      kind: "meeting",
      committeeName: "議会運営委員会",
      meetingDate: "2025-04-30",
    },
  },
  {
    date: "2025-07-24",
    title: "ハラスメントを調べる第三者調査委員会を設置",
    description: "設置経費988万円を含む議案を総務文教委員会で可決しました。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2025-07-24",
    },
  },
  {
    date: "2026-05-19",
    title: "第三者委員会の調査結果に市長が陳謝",
    description:
      "総務文教委員会で調査結果が報告され、市長が陳謝。質疑への回答は留保されました。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2026-05-19",
    },
  },
  {
    date: "2026-05-25",
    title: "市長が5月31日付の退職を申し出",
    description:
      "議会運営委員会で退職の申し出が報告され、副市長が陳謝しました。",
    source: {
      kind: "meeting",
      committeeName: "議会運営委員会",
      meetingDate: "2026-05-25",
    },
  },
  {
    date: "2026-05-29",
    title: "臨時会が退職に同意、5月31日に退職",
    description:
      "「市長の退職の期日に関する同意について」が可決され、村上卓哉市長は5月31日付で退職しました。",
    source: {
      kind: "bill",
      billName: "市長の退職の期日に関する同意について",
    },
  },
  {
    date: "2026-07-12",
    title: "市長選で浦野仁氏が初当選",
    description:
      "4人が立候補し、浦野氏が8,345票で当選。前市長・元市長を破りました。同日の市議補欠選挙では今村寿人氏と世羅翔二郎氏が当選しています。",
    source: {
      kind: "official",
      url: MAYORAL_ELECTION.sourceUrl,
      label: "田川市の投・開票速報",
    },
  },
  {
    date: "2026-07-13",
    title: "浦野仁市長が就任（1期目）",
    description: "8月4日の総務文教委員会で就任の挨拶を行いました。",
    source: {
      kind: "official",
      url: MAYOR_PROFILE.officialProfileUrl,
      label: "田川市 市長プロフィール",
    },
  },
];

export interface UpcomingSession {
  name: string;
  startDate: string;
  endDate: string;
  /** 議会運営委員会で説明された提出予定の議案数（予報値。DBには無い） */
  billCount: number;
  source: TimelineSource;
}

/**
 * 就任後に控える定例会の予告。8月19日の議会運営委員会で説明された内容に基づく。
 * 会期がDBに登録されて会期中になるか、就任後の議案が公開されたら表示しない
 * （判定はローダー側）。会期が終わったらこの定数ごと消す
 */
export const UPCOMING_SESSION: UpcomingSession = {
  name: "令和8年第6回9月定例会",
  startDate: "2026-09-07",
  endDate: "2026-10-08",
  billCount: 20,
  source: {
    kind: "meeting",
    committeeName: "議会運営委員会",
    meetingDate: "2026-08-19",
  },
};
