/**
 * 田川市議会 実データ（会期・議案）
 *
 * 【田川市専用】このファイルは「みらい議会＠田川市」フォーク専用のデータソースです。
 * 他自治体版フォークでは使用しないでください。
 *
 * 出典: 田川市公式サイト「田川市議会からのお知らせ」
 *   https://www.joho.tagawa.fukuoka.jp/list00711.html
 * 各会期の「〜の提出議案と議決結果」個別ページから、議案番号・件名・提出者区分・
 * 議決結果・議決月日を転記した。表現の分かりやすい書き換え（AI生成の解説等）は
 * 一切行っておらず、事実データのみを転記している。
 *
 * 収録範囲: 令和7年（第5回）7月臨時会 〜 令和8年（第4回）6月定例会（直近1年程度）。
 * 令和7年12月定例会の議案第63号は出典ページの抽出時に確認できなかったため未収録
 * （田川市議会事務局への確認が別途必要）。
 *
 * このデータを CSV（packages/seed/csv/data/）に変換するには
 * `pnpm --filter @mirai-gikai/seed tagawa:build-csv` を実行する。
 */

export type Proposer = "mayor" | "member" | "committee";

export interface BillSource {
  /** 議案番号等の表示ラベル（例: "議案第39号"）。番号が無い案件は null */
  billNumberLabel: string | null;
  /** 件名（公式サイト記載のまま） */
  title: string;
  /** 提出者区分 */
  proposer: Proposer;
  /** 議決結果（公式サイト記載のまま。例: "原案可決", "否決", "同意", "承認", "認定", "不認定"） */
  resultLabel: string;
  /** 議決月日（YYYY-MM-DD） */
  resolvedDate: string;
}

export interface SessionSource {
  /** slug生成用キー */
  key: string;
  /** 会期名称（公式サイト記載のまま） */
  name: string;
  startDate: string;
  endDate: string;
  /** 出典ページURL（田川市公式サイト） */
  sourceUrl: string;
  bills: BillSource[];
}

export const TAGAWA_SESSIONS: SessionSource[] = [
  {
    key: "r7-5-rinji",
    name: "令和7年（第5回）7月臨時会",
    startDate: "2025-07-24",
    endDate: "2025-07-24",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311181/index.html",
    bills: [
      {
        billNumberLabel: "報告第6号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第10号　令和7年度田川市一般会計補正予算］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "報告第7号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第11号　令和7年度田川市一般会計補正予算【追加】］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "報告第8号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第12号　田川市病院事業の設置等に関する条例の一部改正について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "報告第9号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第13号　財産の処分について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "報告第10号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第14号　市道路線の認定について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "報告第11号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第15号　財産の取得について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "議案第36号",
        title: "令和7年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "議案第37号",
        title:
          "田川市長の不適切とされる行為に関する第三者調査委員会設置条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "議案第38号",
        title: "損害賠償請求事件に係る和解について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-07-24",
      },
      {
        billNumberLabel: "議員提出議案第43号",
        title: "田川市議会議長不信任決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-07-24",
      },
    ],
  },
  {
    key: "r7-6-teirei",
    name: "令和7年（第6回）9月定例会",
    startDate: "2025-09-05",
    endDate: "2025-10-08",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311415/index.html",
    bills: [
      {
        billNumberLabel: "報告第12号",
        title: "市長専決処分の報告並びに承認を求めることについて［専決第16号］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2025-09-05",
      },
      {
        billNumberLabel: "議案第53号",
        title: "令和7年度田川市一般会計補正予算（追加）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-05",
      },
      {
        billNumberLabel: "議案第39号",
        title: "令和7年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第40号",
        title: "令和7年度田川市国民健康保険特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第41号",
        title: "令和7年度田川市後期高齢者医療特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第42号",
        title: "令和7年度田川市急患医療特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第43号",
        title: "田川市職員の育児休業等に関する条例及び勤務時間条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第44号",
        title: "田川市個人番号の利用に関する条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第45号",
        title: "田川市市税条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第46号",
        title: "田川市防災会議条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第47号",
        title: "田川市放課後児童健全育成事業の設備及び運営に関する基準を定める条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第48号",
        title: "転貸債による借入金貸付契約の締結について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第49号",
        title: "製造請負契約の締結について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第50号",
        title: "固定資産評価審査委員会委員の選任について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第51号",
        title: "教育委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第52号",
        title: "公平委員会委員の選任について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第54号",
        title: "令和7年度田川市一般会計補正予算（追加その2）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議案第55号",
        title: "和解及び損害賠償額の決定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "諮問第1号",
        title: "人権擁護委員候補者の推薦について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "認定第1号",
        title: "令和6年度田川市一般会計歳入歳出決算の認定について",
        proposer: "mayor",
        resultLabel: "不認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "認定第2号",
        title: "令和6年度田川市国民健康保険特別会計歳入歳出決算の認定について",
        proposer: "mayor",
        resultLabel: "認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "認定第3号",
        title: "令和6年度田川市後期高齢者医療特別会計歳入歳出決算の認定について",
        proposer: "mayor",
        resultLabel: "認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "認定第4号",
        title: "令和6年度田川市急患医療特別会計歳入歳出決算の認定について",
        proposer: "mayor",
        resultLabel: "認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "認定第5号",
        title: "令和6年度田川市三線沿線地域交通体系整備事業基金特別会計歳入歳出決算の認定について",
        proposer: "mayor",
        resultLabel: "認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "認定第6号",
        title: "令和6年度田川市病院事業会計決算の認定について",
        proposer: "mayor",
        resultLabel: "認定",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "議員提出議案第44号",
        title: "田川市議会議長不信任決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-05",
      },
      {
        billNumberLabel: "議員提出議案第45号",
        title: "情報公開請求に係る個人情報漏えい調査決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-11",
      },
      {
        billNumberLabel: "議員提出議案第46号",
        title: "指名競争入札による建設工事発注に関する調査決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-09-26",
      },
      {
        billNumberLabel: "議員提出議案第47号",
        title: "子どもの学びと学校における働き方改革の推進を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "議員提出議案第48号",
        title: "地方財政の充実・強化を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "議員提出議案第49号",
        title: "国民健康保険国庫負担の増額を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "議員提出議案第50号",
        title: "訪問介護の報酬改定を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "議員提出議案第51号",
        title: "民生委員・児童委員の確保を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
      {
        billNumberLabel: "委員会提出議案第4号",
        title: "持続可能な病院経営の確保を求める意見書",
        proposer: "committee",
        resultLabel: "原案可決",
        resolvedDate: "2025-10-08",
      },
    ],
  },
  {
    key: "r7-7-teirei",
    name: "令和7年（第7回）12月定例会",
    startDate: "2025-12-01",
    endDate: "2025-12-18",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311472/index.html",
    bills: [
      {
        billNumberLabel: "議案第56号",
        title: "令和7年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第57号",
        title: "令和7年度田川市国民健康保険特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第58号",
        title: "第6次田川市総合計画の基本構想の変更及び後期基本計画の策定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第59号",
        title: "田川地区斎場組合規約の変更について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第60号",
        title: "田川地区斎場組合の解散について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第61号",
        title: "田川地区斎場組合の解散に伴う財産処分について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第62号",
        title:
          "田川地区広域環境衛生施設組合の共同処理する事務の変更及び規約の変更について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第64号",
        title: "財産の取得について（スクールバス）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第65号",
        title: "財産の取得について（電子黒板）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第66号",
        title:
          "指定管理者の指定について（田川文化センター、田川青少年文化ホール）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第67号",
        title: "令和7年度田川市一般会計補正予算（追加）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-01",
      },
      {
        billNumberLabel: "議案第68号",
        title:
          "財産の取得について（2トンプレス式パッカー車、3トンプレス式パッカー車）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第69号",
        title: "令和7年度田川市一般会計補正予算（人件費分）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第70号",
        title: "令和7年度田川市国民健康保険特別会計補正予算（人件費分）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第71号",
        title: "令和7年度田川市後期高齢者医療特別会計補正予算（人件費分）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第72号",
        title: "令和7年度田川市急患医療特別会計補正予算（人件費分）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第73号",
        title: "令和7年度田川市一般会計補正予算（追加その2）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第74号",
        title: "田川市職員の給与に関する条例等の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第75号",
        title:
          "田川市議会議員の議員報酬及び費用弁償等に関する条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第76号",
        title: "和解及び損害賠償の額を定めることについて",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議案第77号",
        title: "和解の一部変更について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "諮問第2号",
        title: "人権擁護委員候補者の推薦について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2025-12-18",
      },
      {
        billNumberLabel: "議員提出議案第52号",
        title: "田川市議会議長不信任決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-01",
      },
      {
        billNumberLabel: "議員提出議案第53号",
        title:
          "永原譲二大任町長の田川市議会に対する不当な政治的介入に関する抗議の決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2025-12-18",
      },
    ],
  },
  {
    key: "r8-1-rinji",
    name: "令和8年（第1回）1月臨時会",
    startDate: "2026-01-19",
    endDate: "2026-01-19",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311511/index.html",
    bills: [
      {
        billNumberLabel: "議案第1号",
        title: "令和7年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-01-19",
      },
    ],
  },
  {
    key: "r8-2-teirei",
    name: "令和8年（第2回）3月定例会",
    startDate: "2026-02-19",
    endDate: "2026-03-18",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311615/index.html",
    bills: [
      {
        billNumberLabel: "報告第1号",
        title:
          "市長専決処分の報告並びに承認を求めることについて（令和7年度田川市一般会計補正予算）",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2026-02-19",
      },
      {
        billNumberLabel: "議案第2号",
        title: "令和7年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第3号",
        title: "令和7年度田川市国民健康保険特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第4号",
        title: "令和7年度田川市後期高齢者医療特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第5号",
        title: "令和7年度田川市急患医療特別会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第6号",
        title: "令和7年度田川市病院事業会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第7号",
        title: "令和8年度田川市一般会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第8号",
        title: "令和8年度田川市国民健康保険特別会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第9号",
        title: "令和8年度田川市後期高齢者医療特別会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第10号",
        title: "令和8年度田川市急患医療特別会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第11号",
        title:
          "令和8年度田川市三線沿線地域交通体系整備事業基金特別会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第12号",
        title: "令和8年度田川市病院事業会計予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第13号",
        title: "田川市印鑑条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第14号",
        title: "田川市国民健康保険税条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第15号",
        title: "田川市猫の不妊去勢費用支援基金条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第16号",
        title: "田川市乳児等通園支援事業の基準を定める条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第17号",
        title: "田川市特定乳児等通園支援事業の基準を定める条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第18号",
        title: "田川市教育・保育施設等の運営に関する基準を定める条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第19号",
        title: "田川市放課後児童クラブ設置条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第20号",
        title: "田川市立小中一貫校猪位金学園教育振興基金条例の制定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-04",
      },
      {
        billNumberLabel: "議案第21号",
        title: "田川市過疎地域持続的発展計画の策定について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第22号",
        title: "特定の事務を取り扱う郵便局の指定変更について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第23号",
        title: "市道路線の認定について（奈良タウン1号線）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第24号",
        title: "固定資産評価審査委員会委員の選任について（和田孝子氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第25号",
        title: "固定資産評価審査委員会委員の選任について（岩岡智之氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議案第26号",
        title: "田川市都市公園条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "諮問第1号",
        title: "人権擁護委員候補者の推薦について（田尼得美穂氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "諮問第2号",
        title: "人権擁護委員候補者の推薦について（村上美鈴氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議員提出議案第54号",
        title: "一般廃棄物処理業務調査特別委員会の経費に関する決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議員提出議案第55号",
        title:
          "情報公開請求個人情報漏えい調査特別委員会の経費に関する決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
      {
        billNumberLabel: "議員提出議案第56号",
        title:
          "指名競争入札建設工事発注調査特別委員会の経費に関する決議について",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2026-03-18",
      },
    ],
  },
  {
    key: "r8-3-rinji",
    name: "令和8年（第3回）5月臨時会",
    startDate: "2026-05-29",
    endDate: "2026-05-29",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311747/index.html",
    bills: [
      {
        billNumberLabel: "報告第2号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第4号　田川市市税条例の一部改正について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2026-05-29",
      },
      {
        billNumberLabel: "報告第3号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第5号　田川市国民健康保険税条例の一部改正について］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2026-05-29",
      },
      {
        billNumberLabel: "報告第4号",
        title:
          "市長専決処分の報告並びに承認を求めることについて［専決第6号　令和8年度田川市一般会計補正予算］",
        proposer: "mayor",
        resultLabel: "承認",
        resolvedDate: "2026-05-29",
      },
      {
        billNumberLabel: null,
        title: "市長の退職の期日に関する同意について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-05-29",
      },
    ],
  },
  {
    key: "r8-4-teirei",
    name: "令和8年（第4回）6月定例会",
    startDate: "2026-06-12",
    endDate: "2026-07-01",
    sourceUrl: "https://www.joho.tagawa.fukuoka.jp/kiji00311782/index.html",
    bills: [
      {
        billNumberLabel: "議案第28号",
        title: "令和8年度田川市一般会計補正予算【追加】",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-06-12",
      },
      {
        billNumberLabel: "議案第27号",
        title: "令和8年度田川市一般会計補正予算",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第29号",
        title: "田川市行政手続条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第30号",
        title: "田川市市税条例の一部改正について",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第31号",
        title: "工事請負契約の変更について（向陽台団地橋梁上部工工事）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第32号",
        title: "市道路線の認定について（大浦団地8号線）",
        proposer: "mayor",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第33号",
        title: "公平委員会委員の選任について（森脇敦史氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第34号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第35号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第36号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第37号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第38号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第39号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第40号",
        title: "農業委員会委員の任命について（原田敏春氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第41号",
        title: "農業委員会委員の任命について（辻繁美氏）",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第42号",
        title: "農業委員会委員の任命について（野中栄藏氏）",
        proposer: "mayor",
        resultLabel: "否決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第43号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第44号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第45号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第46号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議案第47号",
        title: "農業委員会委員の任命について",
        proposer: "mayor",
        resultLabel: "同意",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議員提出議案第57号",
        title: "2027年度政府予算編成に係る教職員定数改善を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: "議員提出議案第58号",
        title: "地方財政の充実・強化を求める意見書",
        proposer: "member",
        resultLabel: "原案可決",
        resolvedDate: "2026-07-01",
      },
      {
        billNumberLabel: null,
        title:
          "陸田孝則議員の公職選挙法違反疑惑に関する検証等特別委員会の審査結果報告について",
        proposer: "committee",
        resultLabel: "可決",
        resolvedDate: "2026-07-01",
      },
    ],
  },
];
