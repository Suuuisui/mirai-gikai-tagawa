/**
 * トップページ編集画面（/homepage）で扱う型定義。
 * 公開サイトのトップページに「何をどの順で出すか」を運営がキュレーション
 * するための、比較検討に必要な最小限の議案情報を持つ。
 */

/** キュレーション対象の議案1件分（一覧・候補・プレビュー共通） */
export type CurationBill = {
  id: string;
  /** 議案の正式名称 */
  name: string;
  /** normal難易度のわかりやすいタイトル（未生成ならnull） */
  title: string | null;
  /** 議決結果などの備考（「否決」等はUIで強調表示する） */
  statusNote: string | null;
  /** 否決・不認定など異例の議決かどうか（statusNoteのパターン一致） */
  isControversial: boolean;
  /** 提出日（YYYY-MM-DD、未設定はnull） */
  submittedDate: string | null;
  /** 会期名（例: 令和7年第2回定例会） */
  sessionName: string | null;
  tags: Array<{ id: string; label: string }>;
  /** 興味度スコア（interest-score.ts）。候補を比較する際の目安 */
  interestScore: number;
  /** 直近90日以内かつ話題性の高い議案か（タグセクション自動昇格の要因） */
  isHot: boolean;
};

/** トップページに表示中のタグセクション1つ分 */
export type FeaturedTagSection = {
  id: string;
  label: string;
  description: string | null;
  /** タグに紐づく公開議案の総数 */
  billCount: number;
  /** このタグ枠に自動選定で表示される議案（上位3件） */
  previewBills: CurationBill[];
  /** 話題性の高い議案を含み、設定順より上に自動昇格しているか */
  isHot: boolean;
};

/** トップページに出していないタグ（追加候補） */
export type HiddenTag = {
  id: string;
  label: string;
  billCount: number;
};

export type HomepageData = {
  /** 「注目の議案」セクションの議案（featured_priority順） */
  featuredBills: CurationBill[];
  /** 注目に追加できる候補（公開済み・未選定。興味度スコア降順） */
  candidateBills: CurationBill[];
  /** トップページに表示中のタグセクション（featured_priority順） */
  featuredTagSections: FeaturedTagSection[];
  /** トップページに出していないタグ */
  hiddenTags: HiddenTag[];
  /** 公開サイトのURL（確認リンク用。未設定ならnull） */
  webUrl: string | null;
};
