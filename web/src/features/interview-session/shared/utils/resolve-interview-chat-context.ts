/**
 * インタビューチャットのシステムプロンプトに使う議案とインタビュー設定の取得元
 *
 * - public: 公開中のものだけを返す（下書きの議案・非公開のインタビュー設定は null）
 * - admin: 公開状態を問わず返す（管理画面のプレビュー専用）
 */
export type InterviewChatContextLoaders<TBill, TConfig> = {
  /** プレビュー用トークンが、その議案に対して有効（存在し、期限内）か */
  validatePreviewToken: (billId: string, token?: string) => Promise<boolean>;
  getPublicBill: (billId: string) => Promise<TBill | null>;
  getPublicInterviewConfig: (billId: string) => Promise<TConfig | null>;
  getAdminBill: (billId: string) => Promise<TBill | null>;
  getAdminInterviewConfig: (billId: string) => Promise<TConfig | null>;
};

export type InterviewChatContext<TBill, TConfig> = {
  bill: TBill;
  interviewConfig: TConfig;
  /** プレビュー用トークンで公開前のものを使っているか */
  isPreview: boolean;
};

/**
 * インタビューチャットで使う議案とインタビュー設定を決める。
 *
 * billId はクライアントから渡される値なので、そのまま公開状態を問わない取得
 * （admin）に渡すと、下書きの議案や非公開のインタビュー設定（質問・深掘りの指針・
 * ナレッジ）がシステムプロンプトに入り、AI の回答から読み出せてしまう。
 * そこで次のように決める。
 *
 * - 通常: 公開中の議案と、公開中（status が public）のインタビュー設定だけを使う
 * - プレビュー用トークンが付いていて、それが有効なときだけ、公開前のものも使う
 *   （管理画面のプレビュー画面のチャットを動かすため。プレビューの各ページと同じ検証）
 *
 * トークンが無効・期限切れのときはエラーにせず、通常（公開中のみ）として扱う。
 * どちらの場合も、使える議案とインタビュー設定の両方がそろわなければ null を返す
 * （公開ページの `!bill || !interviewConfig` なら 404、と同じ条件）。
 */
export async function resolveInterviewChatContext<TBill, TConfig>({
  billId,
  previewToken,
  loaders,
}: {
  billId: string;
  previewToken?: string;
  loaders: InterviewChatContextLoaders<TBill, TConfig>;
}): Promise<InterviewChatContext<TBill, TConfig> | null> {
  const isPreview = previewToken
    ? await loaders.validatePreviewToken(billId, previewToken)
    : false;

  const [bill, interviewConfig] = await Promise.all(
    isPreview
      ? [loaders.getAdminBill(billId), loaders.getAdminInterviewConfig(billId)]
      : [
          loaders.getPublicBill(billId),
          loaders.getPublicInterviewConfig(billId),
        ]
  );

  if (!bill || !interviewConfig) {
    return null;
  }

  return { bill, interviewConfig, isPreview };
}
