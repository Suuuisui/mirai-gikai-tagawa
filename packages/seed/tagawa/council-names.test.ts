import { describe, expect, it } from "vitest";
import { compactName, normalizePersonName } from "./council-names";

describe("normalizePersonName", () => {
  it("全角空白区切りの氏名を「姓 名」にする", () => {
    expect(normalizePersonName("山野　義人")).toEqual({
      name: "山野 義人",
      familyName: "山野",
    });
  });

  it("1文字ずつ空白が入った表記も既知の姓で分ける", () => {
    expect(normalizePersonName("北 山 隆 之")).toEqual({
      name: "北山 隆之",
      familyName: "北山",
    });
  });

  it("空白なしの表記を既知の姓で分ける", () => {
    expect(normalizePersonName("梶原みつ子")).toEqual({
      name: "梶原 みつ子",
      familyName: "梶原",
    });
  });

  it("異体字（榊󠄀・𠮷・辻󠄀）を web 側のキーと同じ字体に寄せる", () => {
    expect(normalizePersonName("榊󠄀原大祐").familyName).toBe("榊原");
    expect(normalizePersonName("村𠮷勇介")).toEqual({
      name: "村吉 勇介",
      familyName: "村吉",
    });
    expect(normalizePersonName("辻󠄀 智之")).toEqual({
      name: "辻 智之",
      familyName: "辻",
    });
  });

  it("姓そのものの別表記（高瀬・尾崎）は member_votes の字体に寄せる", () => {
    expect(normalizePersonName("高瀬 冨士夫").familyName).toBe("髙瀬");
    expect(normalizePersonName("尾崎行人")).toEqual({
      name: "尾﨑 行人",
      familyName: "尾﨑",
    });
  });

  it("1文字の姓も空白なしで分けられ、3文字の姓は2文字の姓より優先する", () => {
    expect(normalizePersonName("辻智之")).toEqual({ name: "辻 智之", familyName: "辻" });
    expect(normalizePersonName("佐々木博")).toEqual({
      name: "佐々木 博",
      familyName: "佐々木",
    });
  });

  it("姓だけ・空文字はそのまま返す", () => {
    expect(normalizePersonName("辻")).toEqual({ name: "辻", familyName: "辻" });
    expect(normalizePersonName("  ")).toEqual({ name: "", familyName: "" });
  });

  it("未知の姓は空白区切り、無ければ先頭2文字を姓とみなす", () => {
    expect(normalizePersonName("鈴木 一郎")).toEqual({
      name: "鈴木 一郎",
      familyName: "鈴木",
    });
    expect(normalizePersonName("鈴木一郎")).toEqual({
      name: "鈴木 一郎",
      familyName: "鈴木",
    });
  });
});

describe("compactName", () => {
  it("照合用に空白と異体字の違いを無くす", () => {
    expect(compactName("榊󠄀原　大祐")).toBe("榊原大祐");
    expect(compactName("榊原 大祐")).toBe("榊原大祐");
  });
});
