import { describe, expect, it } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("指定サイズごとに分割する（端数は最後の配列に入る）", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("サイズ以下の配列はそのまま1つの配列で返す", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("空配列は空を返す", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("サイズが0以下ならエラーを投げる", () => {
    expect(() => chunk([1], 0)).toThrow();
    expect(() => chunk([1], -1)).toThrow();
  });
});
