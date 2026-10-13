import { describe, expect, it } from "vitest";
import { getBillResultLabel, stripResultNoteSuffix } from "./bill-result-label";

describe("stripResultNoteSuffix", () => {
  it.each([
    ["認定（本会議の中継映像より）", "認定"],
    ["原案可決（本会議会議録より自動抽出）", "原案可決"],
    ["原案可決(戒告)", "原案可決"],
    ["懲罰を科す(陳謝)", "懲罰を科す"],
    ["認定（本会議の中継映像より）（速報）", "認定"],
    ["  同意 （本会議の中継映像より） ", "同意"],
  ])("末尾の注記を外す: %s → %s", (statusNote, expected) => {
    expect(stripResultNoteSuffix(statusNote)).toBe(expected);
  });

  it("注記が無ければそのまま返す", () => {
    expect(stripResultNoteSuffix("不認定")).toBe("不認定");
  });

  it("途中の括弧は外さない", () => {
    expect(stripResultNoteSuffix("常任委員会（総務文教）で原案可決")).toBe(
      "常任委員会（総務文教）で原案可決"
    );
  });
});

describe("getBillResultLabel", () => {
  describe("成立した議案（enacted）", () => {
    it.each([
      ["原案可決", "可決"],
      ["可決", "可決"],
      ["修正議決", "修正議決"],
      ["修正可決", "修正可決"],
      ["認定", "認定"],
      ["同意", "同意"],
      ["承認", "承認"],
      ["採択", "採択"],
      ["適任", "適任"],
    ])("status_note「%s」→ %s", (statusNote, expected) => {
      expect(getBillResultLabel("enacted", statusNote)).toBe(expected);
    });

    it.each([
      ["認定（本会議の中継映像より）", "認定"],
      ["原案可決（本会議の中継映像より）", "可決"],
      ["原案可決（本会議会議録より自動抽出）", "可決"],
      ["同意（本会議会議録より自動抽出）", "同意"],
      ["原案可決(戒告)", "可決"],
    ])("出典などの注記が付いていても決まる: %s → %s", (statusNote, expected) => {
      expect(getBillResultLabel("enacted", statusNote)).toBe(expected);
    });
  });

  describe("成立しなかった議案（rejected）", () => {
    it.each([
      ["否決", "否決"],
      ["不認定", "不認定"],
      ["不同意", "不同意"],
      ["不承認", "不承認"],
      ["不採択", "不採択"],
      ["不認定（本会議の中継映像より）", "不認定"],
    ])("status_note「%s」→ %s", (statusNote, expected) => {
      expect(getBillResultLabel("rejected", statusNote)).toBe(expected);
    });
  });

  describe("従来の表示（可決・否決）に戻す場合", () => {
    it.each([
      null,
      undefined,
      "",
      "   ",
    ])("status_note が空（%j）", (statusNote) => {
      expect(getBillResultLabel("enacted", statusNote)).toBe("可決");
      expect(getBillResultLabel("rejected", statusNote)).toBe("否決");
    });

    it.each([
      "懲罰を科す(陳謝)",
      "議決結果不明（出典に記載なし）",
      "賛成多数で認定",
      "常任委員会で原案可決（本会議の議決結果は公表後に掲載）",
      "constructor",
    ])("想定していない語: %s", (statusNote) => {
      expect(getBillResultLabel("enacted", statusNote)).toBe("可決");
      expect(getBillResultLabel("rejected", statusNote)).toBe("否決");
    });

    it("status と食い違う語は使わない（色と語が逆向きにならないように）", () => {
      expect(getBillResultLabel("enacted", "不認定")).toBe("可決");
      expect(getBillResultLabel("enacted", "否決")).toBe("可決");
      expect(getBillResultLabel("rejected", "認定")).toBe("否決");
      expect(getBillResultLabel("rejected", "原案可決")).toBe("否決");
    });
  });
});
