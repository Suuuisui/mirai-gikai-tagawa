import { describe, expect, it } from "vitest";
import {
  castCsvValue,
  convertJsonArrayToPostgresArray,
  convertJsonObjectValue,
} from "./csv-value-cast";

describe("convertJsonArrayToPostgresArray", () => {
  it("プリミティブのみの配列はPostgreSQL配列形式の文字列に変換する", () => {
    expect(convertJsonArrayToPostgresArray('["a","b","c"]')).toBe("{a,b,c}");
  });

  it("カンマや空白を含む要素はクォートする", () => {
    expect(convertJsonArrayToPostgresArray('["a,b","c d"]')).toBe(
      '{"a,b","c d"}'
    );
  });

  it("オブジェクトを含む配列はパース済みの配列をそのまま返す", () => {
    const value = [{ label: "59号", url: "https://example.com/59.pdf" }];
    expect(convertJsonArrayToPostgresArray(JSON.stringify(value))).toEqual(
      value
    );
  });

  it("JSONとして解析できない文字列は元の値を返す", () => {
    expect(convertJsonArrayToPostgresArray("[not json")).toBe("[not json");
  });
});

describe("convertJsonObjectValue", () => {
  it("オブジェクト形式のJSON文字列をパース済みオブジェクトに変換する", () => {
    const value = {
      imageUrl: "https://example.com/vote.png",
      sourceUrl: "https://example.com/result.html",
      entries: [{ name: "山田", faction: "無所属", vote: "yes" }],
    };
    expect(convertJsonObjectValue(JSON.stringify(value))).toEqual(value);
  });

  it("JSONとして解析できない文字列は元の値を返す", () => {
    expect(convertJsonObjectValue("{not json")).toBe("{not json");
  });

  it("配列のJSON文字列（オブジェクトではない）は元の値を返す", () => {
    const arrayJson = "[1,2,3]";
    expect(convertJsonObjectValue(arrayJson)).toBe(arrayJson);
  });

  it("nullのJSON文字列は元の値を返す（objectだがArray.isArrayでもnullでもある扱いを避ける）", () => {
    expect(convertJsonObjectValue("null")).toBe("null");
  });
});

describe("castCsvValue", () => {
  it("空文字はnullに変換する", () => {
    expect(castCsvValue("")).toBeNull();
  });

  it("配列形式の文字列はPostgreSQL配列に変換する", () => {
    expect(castCsvValue('["a","b"]')).toBe("{a,b}");
  });

  it("オブジェクト形式の文字列はパース済みオブジェクトに変換する（member_votes等）", () => {
    const value = { imageUrl: "https://example.com/vote.png", entries: [] };
    expect(castCsvValue(JSON.stringify(value))).toEqual(value);
  });

  it("それ以外の文字列はそのまま返す", () => {
    expect(castCsvValue("議案第69号")).toBe("議案第69号");
  });
});
