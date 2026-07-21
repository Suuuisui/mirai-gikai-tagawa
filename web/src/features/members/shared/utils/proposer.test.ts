import { describe, expect, it } from "vitest";
import { getProposerType, isProposerType } from "./proposer";

describe("isProposerType", () => {
  it("定義済みの提出者区分のみtrueを返す", () => {
    expect(isProposerType("mayor")).toBe(true);
    expect(isProposerType("member")).toBe(true);
    expect(isProposerType("committee")).toBe(true);
    expect(isProposerType("governor")).toBe(false);
    expect(isProposerType("")).toBe(false);
  });
});

describe("getProposerType", () => {
  it("本文の議案情報セクションから市長提出を判定する", () => {
    const content = [
      "## 議案情報",
      "",
      "- **議案番号**: 議案第2号",
      "- **提出者**: 市長提出",
    ].join("\n");
    expect(getProposerType({ name: "議案第2号　○○条例", content })).toBe(
      "mayor"
    );
  });

  it("本文から議員提出・委員会提出を判定する", () => {
    expect(
      getProposerType({
        name: "議案第2号　意見書",
        content: "- **提出者**: 議員提出",
      })
    ).toBe("member");
    // 委員会提出は議案番号が市長提出と同形式（議案第N号）の会期もあるため、
    // 本文判定が名前判定より優先されることを確認する
    expect(
      getProposerType({
        name: "議案第2号　決議",
        content: "- **提出者**: 委員会提出",
      })
    ).toBe("committee");
  });

  it("全角コロン区切りの表記も判定できる", () => {
    expect(
      getProposerType({
        name: "議案第3号　条例",
        content: "- **提出者**： 市長提出",
      })
    ).toBe("mayor");
  });

  it("本文が無い場合は議案番号ラベルの接頭辞で判定する", () => {
    expect(
      getProposerType({ name: "議員提出議案第16号　意見書", content: null })
    ).toBe("member");
    expect(getProposerType({ name: "委員会提出議案第5号　決議" })).toBe(
      "committee"
    );
  });

  it("どちらでも判定できない場合はnullを返す", () => {
    expect(getProposerType({ name: "議案第1号　予算", content: null })).toBe(
      null
    );
    expect(
      getProposerType({ name: "議案第1号　予算", content: "## 解説\n本文" })
    ).toBe(null);
  });
});
