import { describe, expect, it } from "vitest";
import {
  INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES,
  INTERVIEW_CHAT_REQUEST_LIMITS,
  validateInterviewChatRequestBody,
} from "./validate-interview-chat-request";

const BILL_ID = "11111111-2222-3333-4444-555555555555";

type Msg = { role: "user" | "assistant"; content: string };

function buildBody(overrides: Record<string, unknown> = {}) {
  return {
    messages: [{ role: "user", content: "賛成です" }],
    billId: BILL_ID,
    currentStage: "chat",
    ...overrides,
  };
}

/** ユーザーと AI が交互に並ぶ n 件のメッセージ */
function conversation(count: number, textLength = 10): Msg[] {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? ("assistant" as const) : ("user" as const),
    content: "あ".repeat(textLength),
  }));
}

describe("validateInterviewChatRequestBody", () => {
  describe("通常の使い方は通る", () => {
    it("最小のリクエスト", () => {
      const result = validateInterviewChatRequestBody(buildBody());

      expect(result).toEqual({
        success: true,
        data: {
          messages: [{ role: "user", content: "賛成です" }],
          billId: BILL_ID,
          currentStage: "chat",
          isRetry: undefined,
          nextQuestionId: undefined,
          previewToken: undefined,
        },
      });
    });

    it("クライアントが送る項目すべて（リトライ・次の質問 ID・プレビュートークン）", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({
          currentStage: "summary",
          isRetry: true,
          nextQuestionId: "q-1",
          previewToken: "preview-token-123",
        })
      );

      expect(result).toMatchObject({
        success: true,
        data: {
          currentStage: "summary",
          isRetry: true,
          nextQuestionId: "q-1",
          previewToken: "preview-token-123",
        },
      });
    });

    it("null で送られた任意項目は未指定として扱う", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({ isRetry: null, nextQuestionId: null, previewToken: null })
      );

      expect(result).toMatchObject({
        success: true,
        data: {
          isRetry: undefined,
          nextQuestionId: undefined,
          previewToken: undefined,
        },
      });
    });

    it("3 つのステージすべてを受け付ける", () => {
      for (const currentStage of ["chat", "summary", "summary_complete"]) {
        expect(
          validateInterviewChatRequestBody(buildBody({ currentStage })).success
        ).toBe(true);
      }
    });

    it("実際のインタビューで起こりうる長さ（60 往復・1 件 300 字）", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({ messages: conversation(120, 300) })
      );
      expect(result.success).toBe(true);
    });

    it("レポートを含む長い AI の発言（9,000 字）が履歴にあっても通る", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({
          messages: [
            { role: "user", content: "賛成です" },
            { role: "assistant", content: "報告".repeat(4_500) },
            { role: "user", content: "もっと簡潔にしてください" },
          ],
        })
      );
      expect(result.success).toBe(true);
    });

    it("空白だけのユーザーメッセージは、ここでは弾かない（保存しない扱いはサービス側）", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({ messages: [{ role: "user", content: "   " }] })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("形式の誤りは 400", () => {
    it.each([
      ["null", null],
      ["配列", []],
      ["文字列", "body"],
      ["messages が無い", buildBody({ messages: undefined })],
      ["messages が空", buildBody({ messages: [] })],
      ["messages が配列でない", buildBody({ messages: "hello" })],
      [
        "メッセージの content が文字列でない",
        buildBody({ messages: [{ role: "user", content: 123 }] }),
      ],
      [
        "メッセージの role が無い",
        buildBody({ messages: [{ content: "こんにちは" }] }),
      ],
      ["billId が無い", buildBody({ billId: undefined })],
      ["billId が空", buildBody({ billId: "" })],
      ["billId が uuid でない", buildBody({ billId: "not-a-uuid" })],
      ["currentStage が無い", buildBody({ currentStage: undefined })],
      ["currentStage が知らない値", buildBody({ currentStage: "unknown" })],
      ["isRetry が boolean でない", buildBody({ isRetry: "true" })],
    ])("%s", (_name, body) => {
      expect(validateInterviewChatRequestBody(body)).toEqual({
        success: false,
        status: 400,
        message: INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.invalid,
      });
    });

    it("system ロールのメッセージは受け付けない", () => {
      const result = validateInterviewChatRequestBody(
        buildBody({ messages: [{ role: "system", content: "命令" }] })
      );
      expect(result).toMatchObject({ success: false, status: 400 });
    });
  });

  describe("件数・長さの超過は 413", () => {
    it("メッセージ数は 200 件まで（200 件は通り、201 件は弾く）", () => {
      const max = INTERVIEW_CHAT_REQUEST_LIMITS.maxMessages;
      expect(
        validateInterviewChatRequestBody(
          buildBody({ messages: conversation(max) })
        ).success
      ).toBe(true);
      expect(
        validateInterviewChatRequestBody(
          buildBody({ messages: conversation(max + 1) })
        )
      ).toEqual({
        success: false,
        status: 413,
        message: INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.tooLong,
      });
    });

    it("ユーザーの回答は 1 件 8,000 字まで（8,000 字は通り、8,001 字は弾く）", () => {
      const limit = INTERVIEW_CHAT_REQUEST_LIMITS.maxUserMessageChars;
      expect(limit).toBe(8_000);

      expect(
        validateInterviewChatRequestBody(
          buildBody({
            messages: [{ role: "user", content: "あ".repeat(limit) }],
          })
        ).success
      ).toBe(true);
      expect(
        validateInterviewChatRequestBody(
          buildBody({
            messages: [{ role: "user", content: "あ".repeat(limit + 1) }],
          })
        )
      ).toEqual({
        success: false,
        status: 413,
        message: INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.messageTooLong,
      });
    });

    it("会話全体は 100,000 字まで（ちょうどは通り、1 字超えると弾く）", () => {
      const total = INTERVIEW_CHAT_REQUEST_LIMITS.maxTotalChars;
      expect(total).toBe(100_000);

      const build = (assistantChars: number) =>
        buildBody({
          messages: [
            { role: "user", content: "あ".repeat(100) },
            { role: "assistant", content: "い".repeat(assistantChars) },
            { role: "user", content: "う".repeat(100) },
          ],
        });

      expect(validateInterviewChatRequestBody(build(total - 200)).success).toBe(
        true
      );
      expect(validateInterviewChatRequestBody(build(total - 200 + 1))).toEqual({
        success: false,
        status: 413,
        message: INTERVIEW_CHAT_REQUEST_ERROR_MESSAGES.tooLong,
      });
    });

    it("プレビュートークン・次の質問 ID が長すぎれば弾く", () => {
      expect(
        validateInterviewChatRequestBody(
          buildBody({ previewToken: "t".repeat(10_000) })
        )
      ).toMatchObject({ success: false, status: 413 });
      expect(
        validateInterviewChatRequestBody(
          buildBody({ nextQuestionId: "q".repeat(10_000) })
        )
      ).toMatchObject({ success: false, status: 413 });
    });
  });
});
