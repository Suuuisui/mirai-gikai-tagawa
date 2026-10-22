import { describe, expect, it } from "vitest";
import { CHAT_MAX_USER_MESSAGE_CHARS } from "../constants";
import { buildSelectedTextQuestion } from "./build-selected-text-question";

describe("buildSelectedTextQuestion", () => {
  it("選択したテキストを「」で囲んだ質問文にする", () => {
    expect(buildSelectedTextQuestion("予算の補正")).toBe(
      "「予算の補正」について教えてください。"
    );
  });

  it("上限ちょうどの長さなら、そのまま質問文にする", () => {
    const max = 100;
    const wrapperLength = "「」について教えてください。".length;
    const selected = "あ".repeat(max - wrapperLength);

    const question = buildSelectedTextQuestion(selected, max);

    expect(question).toBe(`「${selected}」について教えてください。`);
    expect(question.length).toBe(max);
  });

  it("上限を 1 字でも超えたら、末尾を切って「…」を付け、質問文全体が上限に収まる", () => {
    const max = 100;
    const wrapperLength = "「」について教えてください。".length;
    const selected = "あ".repeat(max - wrapperLength + 1);

    const question = buildSelectedTextQuestion(selected, max);

    expect(question.length).toBe(max);
    expect(question).toContain("…」について教えてください。");
    expect(question.startsWith("「あああ")).toBe(true);
  });

  it("ページ全体を選択したような極端に長いテキストでも、サーバーの上限に収まる", () => {
    const question = buildSelectedTextQuestion("本文".repeat(50_000));

    expect(question.length).toBeLessThanOrEqual(CHAT_MAX_USER_MESSAGE_CHARS);
    expect(question.endsWith("」について教えてください。")).toBe(true);
  });

  it("絵文字（サロゲートペア）の途中で切れても、半端な文字を残さない", () => {
    const max = 40;
    const wrapperLength = "「」について教えてください。".length;
    // 切れ目（available - 1 字目）にちょうど絵文字の前半が来るように並べる
    const available = max - wrapperLength;
    const selected = `${"あ".repeat(available - 2)}😀😀😀`;

    const question = buildSelectedTextQuestion(selected, max);

    // 孤立したサロゲートが無い（well-formed な文字列）
    expect(question.isWellFormed()).toBe(true);
    expect(question.length).toBeLessThanOrEqual(max);
  });

  it("空の選択でも質問文の形になる", () => {
    expect(buildSelectedTextQuestion("")).toBe("「」について教えてください。");
  });
});
