/**
 * サイトに載せている情報の「もと」（出典）の区分【田川市専用】
 *
 * どのページでも同じ3つの名前・色・アイコンで示す（SourceBadge）。
 * 区分を足す・名前を変えるときは /sources の説明も合わせて直す
 */
export type SourceKind = "official" | "transcript" | "disclosure";

export interface SourceKindInfo {
  id: SourceKind;
  /** バッジに単独で出す名前 */
  label: string;
  /** 「公式｜会議録検索システム」のように、何の資料かと並べるときの短い名前 */
  shortLabel: string;
  /** 何をもとにしているか */
  description: string;
  /** 読むときに知っておいてほしいこと */
  caution: string;
}

export const SOURCE_KINDS: Record<SourceKind, SourceKindInfo> = {
  official: {
    id: "official",
    label: "公式サイト・会議録",
    shortLabel: "公式",
    description:
      "田川市と田川市議会が公開しているページ・資料（議決結果、議案の説明資料、一般質問の通告、請願・陳情、議員名簿、投・開票速報など）と、市議会の会議録検索システムに載っている本会議の会議録です。",
    caution:
      "番号・件名・結果・日付などの事実は、公開されている内容をそのまま写しています。解説や要約は運営者がAIを使って書いたもので、市や市議会の見解ではありません。",
  },
  transcript: {
    id: "transcript",
    label: "YouTube中継の文字起こし",
    shortLabel: "文字起こし",
    description:
      "田川市議会の公式YouTubeチャンネルで中継された会議の音声を、文字にしたものです。YouTubeの自動字幕を使い、字幕が付いていない動画は音声認識で文字にしています。",
    caution:
      "人名・地名・数字に聞き取りの誤りが入ることがあります。会議録が公開されていない委員会などの会議と、会議録が出る前の直近の本会議に使っています。正確な発言は中継の録画で確かめてください。",
  },
  disclosure: {
    id: "disclosure",
    label: "情報開示請求の文書",
    shortLabel: "開示請求",
    description:
      "田川市情報公開条例にもとづく開示請求で、市・市議会・選挙管理委員会から交付を受けた文書です（委員会の会議録、選挙の集計資料など）。",
    caution:
      "市のサイトには載っていない文書です。原本の内容をもとに、運営者がAIを使って整理しています。",
  },
};

/** 説明ページや凡例で並べる順（公開されているもの → 補うもの） */
export const SOURCE_KIND_ORDER: readonly SourceKind[] = [
  "official",
  "transcript",
  "disclosure",
];

/** ページの中で「この部分は何がもとか」を1行で示すための項目 */
export interface SourceRef {
  kind: SourceKind;
  /** 何の資料か（例: 会議録検索システム、議決結果ページ） */
  detail?: string;
  /** その資料がページのどの部分のもとになっているか（例: 議決結果、解説） */
  scope: string;
  /** もとの資料へのリンク（外部サイト） */
  href?: string;
}
