import { describe, expect, it } from "vitest";
import {
  countCharacters,
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  fitDescription,
  joinWithinLimit,
} from "./page-description";

describe("countCharacters", () => {
  it("サロゲートペアを 1 字と数える", () => {
    expect(countCharacters("村𠮷")).toBe(2);
    expect(countCharacters("abc")).toBe(3);
  });
});

describe("fitDescription", () => {
  it("120 字以内の文章はそのまま返す", () => {
    const text = "あ".repeat(DESCRIPTION_MAX_LENGTH);
    expect(fitDescription(text)).toBe(text);
  });

  it("改行を取り除く", () => {
    expect(fitDescription("一行目です。\n二行目です。")).toBe(
      "一行目です。二行目です。"
    );
  });

  it("超えるときは 120 字以内で最後の文末までで切る", () => {
    const first = `${"あ".repeat(59)}。`; // 60 字
    const second = `${"い".repeat(49)}。`; // 50 字 → 合計 110 字
    const third = `${"う".repeat(49)}。`; // 50 字 → 合計 160 字
    const result = fitDescription(`${first}${second}${third}`);
    expect(result).toBe(`${first}${second}`);
  });

  it("文末の閉じかっこまで含めて切る", () => {
    const first = `${"あ".repeat(80)}。」`; // 82 字
    const second = `${"い".repeat(60)}。`;
    expect(fitDescription(`${first}${second}`)).toBe(first);
  });

  it("文末で切ると 80 字に満たないときは、119 字で切って … を付ける", () => {
    const first = `${"あ".repeat(39)}。`; // 40 字
    const second = "い".repeat(200);
    const result = fitDescription(`${first}${second}`);
    expect(countCharacters(result)).toBe(DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
    expect(result.startsWith(first)).toBe(true);
  });

  it("文末が 1 つも無い長文も … で切る", () => {
    const result = fitDescription("あ".repeat(300));
    expect(countCharacters(result)).toBe(DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
  });

  it("サロゲートペアを分断しない", () => {
    const result = fitDescription("𠮷".repeat(300), { min: 10, max: 20 });
    expect(countCharacters(result)).toBe(20);
    expect(result).toBe(`${"𠮷".repeat(19)}…`);
  });

  it("max 字ちょうどで文末が来るときはその文末で切る", () => {
    const sentence = `${"あ".repeat(119)}。`; // 120 字
    expect(fitDescription(`${sentence}${"い".repeat(30)}`)).toBe(sentence);
  });

  it("上限より 1 字長いと切る（121 字は、文末があればそこまで、無ければ … で切る）", () => {
    const first = `${"あ".repeat(99)}。`; // 100 字
    const second = `${"い".repeat(20)}。`; // 21 字 → 合計 121 字
    expect(countCharacters(`${first}${second}`)).toBe(
      DESCRIPTION_MAX_LENGTH + 1
    );
    expect(fitDescription(`${first}${second}`)).toBe(first);

    const noSentenceEnd = "あ".repeat(DESCRIPTION_MAX_LENGTH + 1);
    expect(fitDescription(noSentenceEnd)).toBe(
      `${"あ".repeat(DESCRIPTION_MAX_LENGTH - 1)}…`
    );
  });

  describe("最初の文が min 字ちょうどか、1 字足りないか", () => {
    it("最初の文が min 字ちょうどなら、次の文が収まらなくてもその文だけを残す", () => {
      const first = `${"あ".repeat(DESCRIPTION_MIN_LENGTH - 1)}。`;
      expect(countCharacters(first)).toBe(DESCRIPTION_MIN_LENGTH);
      const result = fitDescription(`${first}${"い".repeat(100)}。`);
      expect(result).toBe(first);
    });

    it("最初の文が min 字に 1 字足りないとき、次の文が収まるなら、次の文まで足す", () => {
      const first = `${"あ".repeat(DESCRIPTION_MIN_LENGTH - 2)}。`;
      expect(countCharacters(first)).toBe(DESCRIPTION_MIN_LENGTH - 1);
      const second = `${"い".repeat(30)}。`;
      const result = fitDescription(`${first}${second}${"う".repeat(100)}。`);
      expect(result).toBe(`${first}${second}`);
    });

    it("最初の文が min 字に 1 字足りないとき、次の文が収まらないなら、… で切る", () => {
      const first = `${"あ".repeat(DESCRIPTION_MIN_LENGTH - 2)}。`;
      const result = fitDescription(`${first}${"い".repeat(100)}。`);
      expect(countCharacters(result)).toBe(DESCRIPTION_MAX_LENGTH);
      expect(result.startsWith(first)).toBe(true);
      expect(result.endsWith("…")).toBe(true);
    });
  });

  describe("文末の直後に閉じかっこが続くとき", () => {
    const first = `${"あ".repeat(84)}。`; // 85 字

    it("閉じかっこまで含めて max 字に収まるなら、閉じかっこまで残す", () => {
      const quoted = `「${"い".repeat(32)}。」`; // 35 字 → 閉じかっこがちょうど 120 字目
      expect(countCharacters(`${first}${quoted}`)).toBe(DESCRIPTION_MAX_LENGTH);
      expect(fitDescription(`${first}${quoted}${"う".repeat(30)}。`)).toBe(
        `${first}${quoted}`
      );
    });

    it("句点が max 字目で、閉じかっこが max 字を超えるなら、1 つ前の文末で切る", () => {
      // 「…。」の 。 が 120 字目、」 が 121 字目。閉じかっこだけを落とさない
      const quoted = `「${"い".repeat(33)}。」`;
      expect(countCharacters(`${first}${quoted}`)).toBe(
        DESCRIPTION_MAX_LENGTH + 1
      );
      const result = fitDescription(`${first}${quoted}${"う".repeat(30)}。`);
      expect(result).toBe(first);
      expect(result).not.toContain("「");
    });
  });
});

describe("joinWithinLimit", () => {
  const prefix = "令和8年9月定例会の一般質問。質問者:";
  const suffix = "。";

  it("全部入るときはそのままつなぐ", () => {
    expect(joinWithinLimit({ prefix, items: ["山野", "榊原"], suffix })).toBe(
      `${prefix}山野・榊原${suffix}`
    );
  });

  it("入りきらないときは入る分だけにして「ほか」を付ける", () => {
    const items = Array.from({ length: 30 }, (_, i) => `議員${i + 1}`);
    const result = joinWithinLimit({ prefix, items, suffix, max: 50 });
    expect(countCharacters(result)).toBeLessThanOrEqual(50);
    expect(result.startsWith(`${prefix}議員1・議員2`)).toBe(true);
    expect(result.endsWith(`ほか${suffix}`)).toBe(true);
    expect(result).not.toContain("議員30");
  });

  it("overflow に関数を渡すと、入りきらなかった件数を使える", () => {
    const items = Array.from({ length: 30 }, (_, i) => `議員${i + 1}`);
    const result = joinWithinLimit({
      prefix,
      items,
      suffix,
      max: 50,
      overflow: (omitted) => `ほか${omitted}人`,
    });
    expect(countCharacters(result)).toBeLessThanOrEqual(50);
    const shown = result.slice(prefix.length).split("ほか")[0].split("・");
    expect(result).toContain(`ほか${items.length - shown.length}人${suffix}`);
  });

  it("prefix だけで長すぎるときは切り詰める", () => {
    const longPrefix = "あ".repeat(200);
    const result = joinWithinLimit({
      prefix: longPrefix,
      items: ["山野"],
      max: 30,
    });
    expect(countCharacters(result)).toBeLessThanOrEqual(30);
  });
});
