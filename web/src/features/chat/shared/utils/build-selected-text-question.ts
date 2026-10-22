import { CHAT_MAX_USER_MESSAGE_CHARS } from "../constants";

const QUESTION_PREFIX = "「";
const QUESTION_SUFFIX = "」について教えてください。";
const ELLIPSIS = "…";

/**
 * 議案の本文で選択したテキストから、AI への質問文を作る。
 *
 * 選択範囲が極端に長い（ページ全体を選択したなど）と、サーバーの上限
 * （CHAT_MAX_USER_MESSAGE_CHARS）を超えて送信が拒否され、その後の会話も
 * 続けられなくなる。上限に収まるよう、長すぎる選択は末尾を切って「…」を付ける。
 */
export function buildSelectedTextQuestion(
  selectedText: string,
  maxChars: number = CHAT_MAX_USER_MESSAGE_CHARS
): string {
  const available = maxChars - QUESTION_PREFIX.length - QUESTION_SUFFIX.length;

  let text = selectedText;
  if (selectedText.length > available) {
    let cut = selectedText.slice(0, Math.max(available - ELLIPSIS.length, 0));
    // サロゲートペア（絵文字など）の途中で切れたら、半端な 1 文字を落とす
    const last = cut.charCodeAt(cut.length - 1);
    if (last >= 0xd800 && last <= 0xdbff) {
      cut = cut.slice(0, -1);
    }
    text = `${cut}${ELLIPSIS}`;
  }

  return `${QUESTION_PREFIX}${text}${QUESTION_SUFFIX}`;
}
