import { routes } from "@/lib/routes";
import type { SourceKind } from "./source-kinds";

/** 出典の区分ごとに、サイトのどこで何に使っているか */
export interface SourceUsage {
  /** 何の資料か */
  material: string;
  /** サイトのどの内容のもとになっているか */
  usedFor: string;
  /** その内容が載っているページ（無ければリンクなし） */
  page?: { label: string; href: string };
}

/** もとの資料を自分で確かめるための入口 */
export interface SourceOrigin {
  label: string;
  url: string;
}

export const SOURCE_USAGES: Record<SourceKind, readonly SourceUsage[]> = {
  official: [
    {
      material: "「提出議案と議決結果」のページ",
      usedFor: "議案の番号・件名・提出者・議決結果・議決日、議員別の賛否",
      page: { label: "議会ごとのまとめ", href: routes.sessionArchive() },
    },
    {
      material: "本会議の会議録（会議録検索システム）",
      usedFor:
        "議案の解説（提案理由・質疑・討論・採決）、本会議の記録、請願・陳情の審査の結果と理由",
      page: {
        label: "委員会の記録（本会議を含む）",
        href: routes.committees(),
      },
    },
    {
      material: "議案説明資料・決算書などのPDF",
      usedFor: "議案の解説にある金額・内訳・制度の説明、提出者と賛成者",
    },
    {
      material: "一般質問の一覧と通告書",
      usedFor: "一般質問の質問事項・要旨",
      page: { label: "一般質問", href: routes.questions() },
    },
    {
      material: "「請願・陳情」の審査状況と、請願書・陳情書の原文",
      usedFor: "請願・陳情の件名・付託先・結果、要望の内容と理由",
      page: { label: "請願・陳情", href: routes.petitions() },
    },
    {
      material: "議員名簿、市長のプロフィール、投・開票速報",
      usedFor: "議員の氏名・会派・役職、市長の経歴、選挙の得票と当日の投票状況",
      page: { label: "議員の一覧", href: routes.memberArchive() },
    },
  ],
  transcript: [
    {
      material: "委員会・全員協議会などの中継",
      usedFor:
        "委員会の記録（会議録が公開されていない会議の要約・要点・文字起こしの全文）",
      page: { label: "委員会の記録", href: routes.committees() },
    },
    {
      material: "本会議の中継",
      usedFor:
        "会議録が公開される前の本会議の記録と、直近の会期の議案の解説・議決結果",
      page: { label: "議会ごとのまとめ", href: routes.sessionArchive() },
    },
    {
      material: "上の記録",
      usedFor: "新市長の動き、請願・陳情の審査の経緯",
      page: { label: "新市長の動き", href: routes.mayor() },
    },
  ],
  disclosure: [
    {
      material: "委員会の会議録",
      usedFor:
        "委員会の記録の一部（総務文教委員会の令和3年1月〜令和4年3月、指名競争入札による建設工事発注に関する調査特別委員会）",
      page: { label: "委員会の記録", href: routes.committees() },
    },
    {
      material: "投票結果速報集計用紙、年代別の投票者数・投票率",
      usedFor: "選挙の投票率（年代別・投票区別・期日前投票）",
      page: { label: "選挙の投票率", href: routes.elections() },
    },
  ],
};

export const SOURCE_ORIGINS: Record<SourceKind, readonly SourceOrigin[]> = {
  official: [
    {
      label: "田川市議会（田川市公式サイト）",
      url: "https://www.joho.tagawa.fukuoka.jp/list00703.html",
    },
    {
      label: "田川市議会 会議録検索システム",
      url: "https://www.kensakusystem.jp/tagawa/index.html",
    },
  ],
  transcript: [
    {
      label: "田川市議会の中継（公式YouTubeチャンネルの案内）",
      url: "https://www.joho.tagawa.fukuoka.jp/kiji0037830/index.html",
    },
  ],
  disclosure: [],
};

/**
 * 情報開示請求のいまの状況（手で更新する）。
 * 文書が届いて記録を置き換えたら received に移し、asOf を直す
 */
export const DISCLOSURE_STATUS = {
  asOf: "令和8年10月",
  received: [
    "委員会の会議録の一部（総務文教委員会 12回分、指名競争入札による建設工事発注に関する調査特別委員会 4回分）",
    "令和8年7月の市長選挙・市議会議員補欠選挙と令和5年4月の市議会議員選挙の投票結果、年代別の投票者数・投票率",
  ],
  requested: [
    "令和3年1月以降の委員会・全員協議会などの会議録（まだ届いていない分）",
    "請願・陳情の審査に関する会議録と、採択後の処理の報告",
    "選挙の期日前投票の日ごとの人数",
  ],
} as const;
