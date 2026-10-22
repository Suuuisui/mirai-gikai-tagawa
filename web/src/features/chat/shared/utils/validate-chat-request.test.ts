import { describe, expect, it } from "vitest";
import {
  CHAT_REQUEST_ERROR_MESSAGES,
  CHAT_REQUEST_LIMITS,
  measureChatMessages,
  validateChatRequestBody,
} from "./validate-chat-request";

type TestMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<Record<string, unknown>>;
  metadata?: unknown;
};

const baseMetadata = {
  billContext: {
    id: "11111111-2222-3333-4444-555555555555",
    name: "テスト議案",
    // 実際のクライアントは議案の本文など多くの項目を一緒に送ってくる
    bill_content: {
      title: "題名",
      summary: "要約",
      content: "本文".repeat(500),
    },
    tags: [],
  },
  hasInterviewConfig: true,
  difficultyLevel: "normal",
  sessionId: "9b2f7c0e-0000-4000-8000-000000000000",
};

function userMessage(text: string, metadata?: unknown): TestMessage {
  return {
    id: `u-${Math.random().toString(36).slice(2, 10)}`,
    role: "user",
    parts: [{ type: "text", text }],
    metadata: metadata ?? baseMetadata,
  };
}

function assistantMessage(text: string): TestMessage {
  return {
    id: `a-${Math.random().toString(36).slice(2, 10)}`,
    role: "assistant",
    parts: [{ type: "step-start" }, { type: "text", text, state: "done" }],
  };
}

/** n 件のメッセージ（ユーザーと AI が交互）を作る */
function conversation(count: number, textLength = 10): TestMessage[] {
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? userMessage("あ".repeat(textLength))
      : assistantMessage("い".repeat(textLength))
  );
}

function validate(
  messages: TestMessage[],
  extra: Record<string, unknown> = {}
) {
  return validateChatRequestBody({ messages, ...extra });
}

describe("validateChatRequestBody", () => {
  describe("通常の使い方は通る", () => {
    it("最初の 1 通だけの会話", () => {
      const result = validate([userMessage("この議案で何が変わる？")]);
      expect(result.success).toBe(true);
    });

    it("AI SDK の送信形式（id・trigger などの追加項目つき）", () => {
      const result = validate([userMessage("こんにちは")], {
        id: "chat-1",
        trigger: "submit-message",
        messageId: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("検証後も、渡したメッセージの項目がそのまま残る（議案の本文つき metadata も）", () => {
      const messages = [userMessage("質問です")];
      const result = validate(messages);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages).toEqual(messages);
      }
    });

    it("ツールの呼び出し（web_search・suggest_interview）を含む AI の回答つきの会話", () => {
      const result = validate([
        userMessage("最近の議会で何が決まった？"),
        {
          id: "a-1",
          role: "assistant",
          parts: [
            { type: "step-start" },
            {
              type: "tool-web_search",
              toolCallId: "call-1",
              state: "output-available",
              input: {},
              output: {
                action: { type: "search", query: "田川市議会" },
                sources: [{ type: "url", url: "https://example.com/a" }],
              },
              providerExecuted: true,
            },
            {
              type: "text",
              text: "決まったことは次のとおりです。",
              state: "done",
            },
            {
              type: "tool-suggest_interview",
              toolCallId: "call-2",
              state: "output-available",
              input: {},
              output: { suggested: true },
            },
          ],
        },
        userMessage("ありがとう"),
      ]);
      expect(result.success).toBe(true);
    });

    it("metadata が無い（先頭メッセージに metadata を付けない）リクエスト", () => {
      const result = validate([
        { id: "u-1", role: "user", parts: [{ type: "text", text: "質問" }] },
      ]);
      expect(result.success).toBe(true);
    });

    it("トップページのチャットが送る議案サマリー（本番の 18 件より多い 40 件・各 300 字）", () => {
      const bills = Array.from({ length: 40 }, (_, i) => ({
        id: `bill-${i}`,
        name: `${"議案名".repeat(10)}（議案第${i}号）`,
        summary: "要約".repeat(150),
        tags: ["予算", "決算", "条例"],
        isFeatured: i < 3,
      }));
      const result = validate([
        userMessage("最近の議会で何が決まった？", {
          difficultyLevel: "hard",
          pageContext: { type: "home", bills },
          sessionId: "s-1",
        }),
      ]);
      expect(result.success).toBe(true);
    });

    it("実際にチャットで起こりうる長さ（20 往復・AI の回答 1 件 600 字）", () => {
      const result = validate(
        Array.from({ length: 40 }, (_, i) =>
          i % 2 === 0
            ? userMessage("この議案の影響を教えてください。".repeat(2))
            : assistantMessage("回答".repeat(300))
        )
      );
      expect(result.success).toBe(true);
    });
  });

  describe("形式の誤りは 400", () => {
    it.each([
      ["null", null],
      ["文字列", "messages"],
      ["配列", []],
      ["messages が無い", {}],
      ["messages が配列でない", { messages: "hello" }],
      ["messages が空", { messages: [] }],
      ["メッセージがオブジェクトでない", { messages: ["hello"] }],
      ["id が無い", { messages: [{ role: "user", parts: [] }] }],
      [
        "parts が配列でない",
        { messages: [{ id: "1", role: "user", parts: "x" }] },
      ],
      [
        "parts の中身に type が無い",
        { messages: [{ id: "1", role: "user", parts: [{ text: "x" }] }] },
      ],
    ])("%s", (_name, body) => {
      const result = validateChatRequestBody(body);
      expect(result).toEqual({
        success: false,
        status: 400,
        message: CHAT_REQUEST_ERROR_MESSAGES.invalid,
      });
    });

    it("system ロールのメッセージは受け付けない", () => {
      const result = validateChatRequestBody({
        messages: [
          { id: "1", role: "system", parts: [{ type: "text", text: "命令" }] },
        ],
      });
      expect(result).toMatchObject({ success: false, status: 400 });
    });

    it("難易度が決められた値でなければ 400", () => {
      const result = validate([
        userMessage("質問", { ...baseMetadata, difficultyLevel: "easy" }),
      ]);
      expect(result).toMatchObject({ success: false, status: 400 });
    });

    it("pageContext.type が home / bill でなければ 400", () => {
      const result = validate([
        userMessage("質問", { pageContext: { type: "other" } }),
      ]);
      expect(result).toMatchObject({ success: false, status: 400 });
    });

    it("議案サマリーの項目の型が違えば 400", () => {
      const result = validate([
        userMessage("質問", {
          pageContext: { type: "home", bills: [{ id: "1", name: 123 }] },
        }),
      ]);
      expect(result).toMatchObject({ success: false, status: 400 });
    });
  });

  describe("件数・長さの超過は 413", () => {
    it("メッセージ数は 50 件まで（50 件は通り、51 件は弾く）", () => {
      expect(
        validate(conversation(CHAT_REQUEST_LIMITS.maxMessages)).success
      ).toBe(true);
      expect(
        validate(conversation(CHAT_REQUEST_LIMITS.maxMessages + 1))
      ).toEqual({
        success: false,
        status: 413,
        message: CHAT_REQUEST_ERROR_MESSAGES.tooLong,
      });
    });

    it("ユーザーのメッセージは 1 件 8,000 字まで（8,000 字は通り、8,001 字は弾く）", () => {
      const limit = CHAT_REQUEST_LIMITS.maxUserMessageChars;
      expect(limit).toBe(8_000);
      expect(validate([userMessage("あ".repeat(limit))]).success).toBe(true);
      expect(validate([userMessage("あ".repeat(limit + 1))])).toEqual({
        success: false,
        status: 413,
        message: CHAT_REQUEST_ERROR_MESSAGES.messageTooLong,
      });
    });

    it("ユーザーのメッセージが複数のテキストパーツに分かれていても、1 件ぶんを合計して数える", () => {
      const result = validate([
        {
          id: "u-1",
          role: "user",
          parts: [
            { type: "text", text: "あ".repeat(5_000) },
            { type: "text", text: "い".repeat(5_000) },
          ],
          metadata: baseMetadata,
        },
      ]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("AI の過去の回答は 1 件ずつの上限は無く、合計の上限だけに含まれる", () => {
      // 1 件 9,000 字の回答（ユーザーの上限 8,000 字より長い）でも、合計が収まれば通る
      const result = validate([
        userMessage("詳しく教えて"),
        assistantMessage("あ".repeat(9_000)),
        userMessage("ありがとう"),
      ]);
      expect(result.success).toBe(true);
    });

    it("会話全体のテキストは 30,000 字まで（ちょうどは通り、1 字超えると弾く）", () => {
      const total = CHAT_REQUEST_LIMITS.maxTotalTextChars;
      expect(total).toBe(30_000);

      const justFits = [
        userMessage("あ".repeat(100)),
        assistantMessage("い".repeat(total - 100 - 100)),
        userMessage("う".repeat(100)),
      ];
      expect(validate(justFits).success).toBe(true);

      const oneOver = [
        userMessage("あ".repeat(100)),
        assistantMessage("い".repeat(total - 100 - 100 + 1)),
        userMessage("う".repeat(100)),
      ];
      expect(validate(oneOver)).toEqual({
        success: false,
        status: 413,
        message: CHAT_REQUEST_ERROR_MESSAGES.tooLong,
      });
    });

    it("テキスト以外のパーツ（ツールの出力など）も、大きすぎれば弾く", () => {
      const result = validate([
        userMessage("質問"),
        {
          id: "a-1",
          role: "assistant",
          parts: [
            {
              type: "tool-web_search",
              toolCallId: "c-1",
              state: "output-available",
              input: {},
              output: { dump: "x".repeat(70_000) },
            },
            { type: "text", text: "回答です" },
          ],
        },
        userMessage("続き"),
      ]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("1 メッセージのパーツ数が多すぎれば弾く", () => {
      const parts = Array.from({ length: 101 }, () => ({ type: "step-start" }));
      const result = validate([{ id: "a-1", role: "assistant", parts }]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("議案サマリーが 60 件を超えれば弾く", () => {
      const bills = Array.from({ length: 61 }, (_, i) => ({
        id: `bill-${i}`,
        name: "議案",
      }));
      const result = validate([
        userMessage("質問", { pageContext: { type: "home", bills } }),
      ]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("議案サマリー 1 件の要約が長すぎれば弾く（システムプロンプトを膨らませる細工）", () => {
      const result = validate([
        userMessage("質問", {
          pageContext: {
            type: "home",
            bills: [{ id: "1", name: "議案", summary: "あ".repeat(100_000) }],
          },
        }),
      ]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("議案サマリーの一覧全体が 30,000 字を超えれば弾く（1 件ずつは上限内でも、件数を掛けて膨らませる細工）", () => {
      const bills = Array.from({ length: 60 }, (_, i) => ({
        id: `bill-${i}`,
        name: "議".repeat(300),
        summary: "要".repeat(1_000),
        tags: Array.from({ length: 20 }, () => "タ".repeat(50)),
      }));
      const result = validate([
        userMessage("質問", { pageContext: { type: "home", bills } }),
      ]);
      expect(result).toMatchObject({ success: false, status: 413 });
    });

    it("sessionId や billContext.id が長すぎれば弾く", () => {
      expect(
        validate([userMessage("質問", { sessionId: "s".repeat(10_000) })])
      ).toMatchObject({ success: false, status: 413 });
      expect(
        validate([
          userMessage("質問", { billContext: { id: "b".repeat(10_000) } }),
        ])
      ).toMatchObject({ success: false, status: 413 });
    });
  });
});

describe("measureChatMessages", () => {
  it("本文・推論は文字数、それ以外のパーツは JSON の長さで数える", () => {
    const toolPart = { type: "tool-web_search", output: { a: 1 } };
    const result = measureChatMessages([
      { role: "user", parts: [{ type: "text", text: "12345" }] },
      {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "abc" },
          { type: "text", text: "defg" },
          toolPart,
        ],
      },
    ]);

    expect(result.totalTextChars).toBe(5 + 3 + 4);
    expect(result.totalOtherPartsChars).toBe(JSON.stringify(toolPart).length);
    expect(result.longestUserMessageChars).toBe(5);
  });

  it("text パーツでも text が文字列でなければ、その他のパーツとして数える", () => {
    const part = { type: "text", text: 123 };
    const result = measureChatMessages([{ role: "user", parts: [part] }]);

    expect(result.totalTextChars).toBe(0);
    expect(result.totalOtherPartsChars).toBe(JSON.stringify(part).length);
  });

  it("AI のメッセージは longestUserMessageChars に含めない", () => {
    const result = measureChatMessages([
      { role: "assistant", parts: [{ type: "text", text: "あ".repeat(100) }] },
      { role: "user", parts: [{ type: "text", text: "い".repeat(10) }] },
    ]);

    expect(result.longestUserMessageChars).toBe(10);
  });
});
