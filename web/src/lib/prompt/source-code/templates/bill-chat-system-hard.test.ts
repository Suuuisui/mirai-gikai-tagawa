import { describe, expect, it } from "vitest";
import { buildBillChatSystemHardPrompt } from "./bill-chat-system-hard";

describe("buildBillChatSystemHardPrompt", () => {
  it("4つのパラメータがプロンプトに埋め込まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "テスト法案名",
      "テスト法案タイトル",
      "テスト法案要約",
      "テスト法案詳細"
    );

    expect(result).toContain("テスト法案名");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案要約");
    expect(result).toContain("テスト法案詳細");
  });

  it("難易度「難しい」セクションが含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).toContain("回答の難易度：難しい");
    expect(result).toContain("専門用語を正確に使用");
  });

  it("みらい議会の説明が含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).toContain("みらい議会");
    expect(result).toContain("チームみらい");
  });

  it("knowledgeSource を渡すと <knowledge_source> セクションが含まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "a",
      "b",
      "c",
      "d",
      "補足知識"
    );

    expect(result).toContain("補足ナレッジ");
    expect(result).toContain("補足知識");
  });

  it("knowledgeSource を省略するとセクションごと出ない", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).not.toContain("<knowledge_source>");
  });

  it("memberVotes・sponsors を渡すと議員別の賛否・提出者情報が含まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "a",
      "b",
      "c",
      "d",
      "",
      "賛成1・反対1",
      "提出者: 山田太郎"
    );

    expect(result).toContain("議員別の賛否・提出者情報");
    expect(result).toContain("賛成1・反対1");
    expect(result).toContain("提出者: 山田太郎");
    expect(result).toContain("評価・批判する表現はしないでください");
  });

  it("memberVotes・sponsors を省略するとセクションごと出ない", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).not.toContain("議員別の賛否・提出者情報");
  });

  it("billUrl を渡すと詳細ページURLが含まれる", () => {
    const result = buildBillChatSystemHardPrompt(
      "a",
      "b",
      "c",
      "d",
      "",
      "",
      "",
      "/bills/xyz"
    );

    expect(result).toContain("詳細ページURL: /bills/xyz");
  });

  it("billUrl を省略すると詳細ページURLの行が出ない", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).not.toContain("- 詳細ページURL:");
  });

  it("議案へのリンク案内ルールが含まれる", () => {
    const result = buildBillChatSystemHardPrompt("a", "b", "c", "d");

    expect(result).toContain("議案へのリンク案内について");
  });
});
