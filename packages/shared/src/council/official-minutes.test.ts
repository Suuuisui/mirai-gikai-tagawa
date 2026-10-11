import { describe, expect, it } from "vitest";
import { minutesFileNameToDate, officialMinutesUrl } from "./official-minutes";

describe("minutesFileNameToDate", () => {
  it("令和のファイル名を西暦の日付に直す", () => {
    expect(minutesFileNameToDate("R080612A")).toBe("2026-06-12");
    expect(minutesFileNameToDate("R010513A")).toBe("2019-05-13");
  });

  it("平成のファイル名を西暦の日付に直す", () => {
    expect(minutesFileNameToDate("H100305A")).toBe("1998-03-05");
    expect(minutesFileNameToDate("H310308A")).toBe("2019-03-08");
  });

  it("形が違うものは null", () => {
    expect(minutesFileNameToDate("S630101A")).toBeNull();
    expect(minutesFileNameToDate("R0806")).toBeNull();
  });
});

describe("officialMinutesUrl", () => {
  it("コードとファイル名から1日分の会議録のURLを組み立てる", () => {
    expect(officialMinutesUrl("abc123", "R080612A")).toBe(
      "https://www.kensakusystem.jp/tagawa/cgi-bin3/ResultFrame.exe?Code=abc123&fileName=R080612A&startPos=0"
    );
  });
});
