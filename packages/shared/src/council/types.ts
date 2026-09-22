/**
 * 田川市議会の「請願・陳情」と「一般質問（通告）」のデータ型【田川市専用】
 *
 * 公式サイトの公開ページを packages/seed/tagawa のスクレイパーで読み取り、
 * web 側の静的データ（features/petitions, features/general-questions）として
 * 書き出す。DBは使わず、公式ページが更新されたら再生成してコミットする運用。
 * 型を seed と web の両方から参照するため packages/shared に置く
 */

/** 請願（seigan: 議員の紹介が必要）と陳情（chinjo: 誰でも出せる） */
export type PetitionKind = "seigan" | "chinjo";

/**
 * 審査結果の分類
 * - adopted: 採択
 * - rejected: 不採択
 * - partial: 項目ごとに採択・不採択が分かれた
 * - withdrawn: 取り下げ
 * - expired: 審議未了・審査未了（結論が出ないまま任期満了など）
 * - continued: 継続審査（次の会期に持ち越し）
 * - pending: 審査中（結果の記載なし）
 */
export type PetitionStatus =
  | "adopted"
  | "rejected"
  | "partial"
  | "withdrawn"
  | "expired"
  | "continued"
  | "pending";

/** 請願の紹介議員 */
export interface PetitionIntroducer {
  /** 表示名（姓 名） */
  name: string;
  /** 姓（議員ページのキー） */
  familyName: string;
}

/** 請願・陳情1件 */
export interface PetitionRecord {
  /** 安定ID（種別-公式ページID-番号） */
  id: string;
  kind: PetitionKind;
  /** 公式ページの表内の番号（ページごとに1から） */
  number: number;
  title: string;
  /** 請願文・陳情文のPDF（無い場合は null） */
  documentUrl: string | null;
  /** 紹介議員（請願のみ。先頭が代表者） */
  introducers: PetitionIntroducer[];
  /** 上程日（YYYY-MM-DD） */
  submittedDate: string;
  /** 付託先の委員会（正式名。項目ごとに分かれた場合は複数） */
  committees: string[];
  /** 審査結果が出た日（YYYY-MM-DD。審査中は null） */
  decidedDate: string | null;
  status: PetitionStatus;
  /** 公式ページの結果表記（例: 採択、項目1: 不採択 / 項目2: 採択） */
  result: string | null;
  /** 採択後の措置（執行部送付・意見書提出など） */
  measure: string | null;
  /** 公式ページのURL */
  sourceUrl: string;
  /** 公式ページのタイトル（掲載期間） */
  sourceTitle: string;
}

/** 一般質問の質問形式（一括質問＝一括質問一括答弁。総括質問と書かれることもある） */
export type QuestionFormat = "一問一答" | "一括質問";

/** 通告書PDFに載っている質問1件の要旨（⑴⑵…と、その下のア・イ…） */
export interface QuestionOutlinePoint {
  text: string;
  subPoints: string[];
}

/** 通告書PDFから読み取った質問事項1つ分 */
export interface QuestionOutlineItem {
  title: string;
  points: QuestionOutlinePoint[];
}

/** 議員1人の1回の一般質問（通告） */
export interface GeneralQuestionRecord {
  /** 安定ID（会期キー-順番） */
  id: string;
  /** 会期キー（diet_sessions.slug と同じ形式。例: r8-6-teirei） */
  sessionKey: string;
  /** 会期名（例: 令和8年（第6回）9月定例会） */
  sessionName: string;
  /** 質問日（YYYY-MM-DD。判別できない場合は null） */
  questionDate: string | null;
  /** 何日目か（1始まり。判別できない場合は null） */
  dayIndex: number | null;
  /** 質問の順番 */
  order: number;
  /** 議員の表示名（姓 名） */
  memberName: string;
  /** 姓（議員ページのキー） */
  familyName: string;
  /** 会派名（代表質問のときだけ公式ページに載る） */
  faction: string | null;
  /** 代表質問かどうか */
  isRepresentative: boolean;
  /** 質問形式（通告書PDFに記載がある場合） */
  format: QuestionFormat | null;
  /** 質問事項（公式ページの表記） */
  items: string[];
  /** 通告書PDFの要旨（PDFが無い・読み取れない場合は null） */
  outline: QuestionOutlineItem[] | null;
  /** 公式YouTubeチャンネルの録画（議員ごとに1本ある場合） */
  videoUrl: string | null;
  /** 公式ページのURL */
  sourceUrl: string;
  /** 通告書PDFのURL */
  pdfUrl: string | null;
}
