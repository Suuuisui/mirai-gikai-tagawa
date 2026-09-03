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
 * - 就任後の動き・就任までの経緯: 当サイトの委員会記録（committee_meetings）
 */

export interface MayorProfile {
  /** 姓 名（半角スペース区切り） */
  name: string;
  reading: string;
  /** YYYY-MM-DD */
  birthDate: string;
  /** 就任日（YYYY-MM-DD）。この日以降の議案を「新市長の提出議案」として扱う */
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

/** 出来事の出典。会議・議案は名前で持ち、IDはローダーが一覧から引く */
export type TimelineSource =
  | { kind: "meeting"; committeeName: string; meetingDate: string }
  | { kind: "bill"; billName: string }
  | { kind: "official"; url: string; label: string };

export interface TimelineEvent {
  /** YYYY-MM-DD */
  date: string;
  /** 何が起きたかが一目で分かる見出し（30字以内） */
  title: string;
  /** 出典の見出し・記載の範囲で書く（推測を足さない） */
  description: string;
  source: TimelineSource;
}

/**
 * 就任後に市長と市役所（執行部）が議会でしたこと【古い順・手で追記する】
 *
 * 委員会記録を取り込んだら、市長に関わる事実をここに追記する。
 * 要点の文字列から「市長」を含む文を機械的に拾う方式は、前市長を指す文まで
 * 新市長の動きとして出してしまったため、人が読んで書く。
 * title は「何をしたか」の形、description は出典の記録に書かれた範囲に留める
 */
export const MAYOR_ACTIONS: readonly TimelineEvent[] = [
  {
    date: "2026-07-13",
    title: "田川市長に就任",
    description:
      "前市長の退職に伴う7月12日の市長選で初当選し、翌13日に就任しました（1期目）。",
    source: {
      kind: "official",
      url: MAYOR_PROFILE.officialProfileUrl,
      label: "田川市 市長プロフィール",
    },
  },
  {
    date: "2026-08-04",
    title: "総務文教委員会で就任のあいさつ",
    description:
      "委員会の冒頭で就任のあいさつを行いました。同じ日、補欠選挙で当選した世羅翔二郎議員も委員として紹介されています。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2026-08-04",
    },
  },
  {
    date: "2026-08-04",
    title: "ハラスメント防止条例をつくる方針を市が報告",
    description:
      "市長・副市長・教育長・議員・職員を対象にハラスメントを禁止し、外部の相談窓口を設ける条例です。早ければ9月議会に提案します。前市長の給料5割減額の条例は、退職に伴い廃止する方針も示されました。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2026-08-04",
    },
  },
  {
    date: "2026-08-10",
    title: "8月臨時会に議案2件を提出",
    description:
      "前市長の給料5割減額の期間を退職日の5月31日までに短縮する条例改正と、新しい副市長の選任に議会の同意を求める議案です。本会議の冒頭では就任のあいさつを行いました。副市長選任の採決方法は、議会運営委員会で意見が分かれ、委員長裁定で無記名投票に決まりました。",
    source: {
      kind: "meeting",
      committeeName: "議会運営委員会",
      meetingDate: "2026-08-10",
    },
  },
  {
    date: "2026-08-17",
    title: "東高校跡地の請願、新市長の方針を聞くため継続審査に",
    description:
      "建設経済委員会で、田川東高校跡地の活用の早期実現を求める請願が、新市長の方針を聞いてから判断するとして継続審査になりました。",
    source: {
      kind: "meeting",
      committeeName: "建設経済委員会",
      meetingDate: "2026-08-17",
    },
  },
  {
    date: "2026-08-19",
    title: "9月定例会に20議案を提出予定と説明",
    description:
      "9月7日開会の定例会に、令和7年度決算の認定6件、補正予算5件、条例3件などの計20議案と報告4件を出す予定です。令和7年度の一般会計決算は実質収支7億9445万円の黒字でした。",
    source: {
      kind: "meeting",
      committeeName: "議会運営委員会",
      meetingDate: "2026-08-19",
    },
  },
];

/** 市長交代の経緯セクションの導入文。タイムラインを読む前の3行まとめ */
export const ROAD_TO_INAUGURATION_SUMMARY =
  "前市長の公務出張中の不倫やハラスメント問題を受け、議会は給料の5割減額や第三者調査委員会の設置で対応し、不信任決議案は2度とも否決されました。第三者委員会の報告後、前市長は2026年5月31日に退職し、7月12日の市長選で浦野氏が当選しました。";

/**
 * 前市長の問題が表面化してから新市長就任までの経緯【古い順】。
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
      "総務文教委員会で減額条例を可決。「問題の幕引きは許さない」との討論もありました。同じ日に出された最初の市長不信任決議案（議案第38号）は否決されています。",
    source: {
      kind: "meeting",
      committeeName: "総務文教委員会",
      meetingDate: "2025-03-19",
    },
  },
  {
    date: "2025-04-30",
    title: "2度目の市長不信任決議案も臨時会で否決",
    description:
      "市民からは起立採決の要望が出ましたが、採決方法は無記名投票に決まり、決議案（議案第41号）は否決されました。",
    source: {
      kind: "bill",
      billName: "議案第41号　村上卓哉田川市長に対する不信任決議について",
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
    description: "8月4日の総務文教委員会で就任のあいさつを行いました。",
    source: {
      kind: "official",
      url: MAYOR_PROFILE.officialProfileUrl,
      label: "田川市 市長プロフィール",
    },
  },
];

export interface UpcomingSession {
  name: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  /** 「就任後はじめての定例会」のような、注目する理由の一言 */
  note: string;
  /** 議会運営委員会で説明された提出予定の議案数（予報値。DBには無い） */
  billCount: number;
  /** 見どころ（出典の範囲内で3つまで） */
  highlights: readonly string[];
  source: TimelineSource;
}

/**
 * 就任後に控える定例会の予告。8月19日の議会運営委員会で説明された内容に基づく
 * （ハラスメント防止条例の見どころだけは8月4日の総務文教委員会）。
 * 会期が終わると表示されなくなる（判定はローダー側）ので、終わったら
 * 次の定例会の内容に書き換えるか、この定数ごと消す
 */
export const UPCOMING_SESSION: UpcomingSession = {
  name: "令和8年第6回9月定例会",
  startDate: "2026-09-07",
  endDate: "2026-10-08",
  note: "就任後はじめての定例会",
  billCount: 20,
  highlights: [
    "令和7年度決算の認定6件（一般会計は実質収支7億9445万円の黒字）",
    "補正予算5件。老朽化したコミュニティバスを更新するノンステップバスの購入費など",
    "ハラスメント防止条例（市長・議員も対象）は早ければこの定例会に提案予定",
  ],
  source: {
    kind: "meeting",
    committeeName: "議会運営委員会",
    meetingDate: "2026-08-19",
  },
};
