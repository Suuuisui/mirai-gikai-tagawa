/**
 * 委員会の説明（何を審議する場なのか）【田川市専用】
 *
 * 委員会名だけでは何をする会議か伝わらないため、市民向けの一言説明と
 * 種別を添える。出典は田川市議会の公式サイトおよび各委員会の設置目的。
 * 捏造禁止。判断できない委員会は DEFAULT_COMMITTEE_PROFILE にフォールバックする。
 */

/** 委員会の種別 */
export type CommitteeKind = "standing" | "special" | "other";

export interface CommitteeProfile {
  kind: CommitteeKind;
  /** 一覧・詳細で使う短い呼び名（正式名称が長い特別委員会用） */
  shortName: string;
  /** 何を審議する場かの説明（1〜2文） */
  description: string;
}

export const COMMITTEE_KIND_LABELS: Record<CommitteeKind, string> = {
  standing: "常任委員会",
  special: "特別委員会",
  other: "その他の会議",
};

export const COMMITTEE_PROFILES: Record<string, CommitteeProfile> = {
  総務文教委員会: {
    kind: "standing",
    shortName: "総務文教委員会",
    description:
      "市の予算・税金・防災・学校教育などを担当する常任委員会です。本会議に先立ち、関係する議案を詳しく審査します。",
  },
  厚生委員会: {
    kind: "standing",
    shortName: "厚生委員会",
    description:
      "福祉・健康・国民健康保険・市立病院・ごみ処理などの暮らしに関わる分野を担当する常任委員会です。",
  },
  建設経済委員会: {
    kind: "standing",
    shortName: "建設経済委員会",
    description:
      "道路・住宅・都市計画・農林業・商工観光など、まちづくりと産業の分野を担当する常任委員会です。",
  },
  議会運営委員会: {
    kind: "standing",
    shortName: "議会運営委員会",
    description:
      "本会議の日程や議事の進め方、議会のルールを決める委員会です。各会派の代表が集まって協議します。",
  },
  指名競争入札による建設工事発注に関する調査特別委員会: {
    kind: "special",
    shortName: "入札調査特別委員会（百条委員会）",
    description:
      "市の建設工事の入札で不適切な発注がなかったかを調べるために設置された特別委員会です。地方自治法100条に基づき、関係者の出頭や記録の提出を求める強い調査権を持ちます（百条委員会）。",
  },
  陸田孝則議員の公職選挙法及び田川市政治倫理条例違反疑惑に関する検証等特別委員会:
    {
      kind: "special",
      shortName: "議員の選挙法・政治倫理疑惑 検証特別委員会",
      description:
        "市議会議員をめぐる公職選挙法違反や政治倫理条例違反の疑いを検証するために設置された特別委員会です。政治倫理条例の見直しもあわせて議論しています。",
    },
  情報公開請求に係る個人情報漏えいに関する調査特別委員会: {
    kind: "special",
    shortName: "個人情報漏えい 調査特別委員会",
    description:
      "情報公開請求をした人の個人情報が外部に漏れた疑いを調べるために設置された特別委員会です。",
  },
  一般廃棄物処理事業特別委員会: {
    kind: "special",
    shortName: "ごみ処理事業 特別委員会",
    description:
      "家庭ごみ・事業系ごみの収集運搬の許可や委託契約が適正だったかを調べる特別委員会です。",
  },
  全員協議会: {
    kind: "other",
    shortName: "全員協議会",
    description:
      "議員全員が集まり、市から重要な報告を受けたり意見交換したりする会議です。議決は行いません。",
  },
  議会報告会: {
    kind: "other",
    shortName: "議会報告会",
    description:
      "議会での審議内容を市民に報告し、意見を聞くために開かれる会です。",
  },
};

export const DEFAULT_COMMITTEE_PROFILE: CommitteeProfile = {
  kind: "other",
  shortName: "",
  description: "田川市議会で開かれた会議の記録です。",
};

/** 委員会名から説明を引く（未登録の委員会はデフォルトに正式名称を入れて返す） */
export function getCommitteeProfile(committeeName: string): CommitteeProfile {
  const profile = COMMITTEE_PROFILES[committeeName];
  if (profile) return profile;
  return { ...DEFAULT_COMMITTEE_PROFILE, shortName: committeeName };
}
