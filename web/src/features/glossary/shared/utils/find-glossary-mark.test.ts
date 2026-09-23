import { describe, expect, it } from "vitest";
import type { GlossaryEntry } from "../data/glossary";
import { findGlossaryMark } from "./find-glossary-mark";

const entries: GlossaryEntry[] = [
  { term: "基金", aliases: ["積立金"], description: "貯金。" },
  { term: "財政調整基金", description: "備えの貯金。" },
  { term: "繰入金", aliases: ["繰入れ"], description: "移すお金。" },
  { term: "補正予算", description: "年度途中の変更。" },
  { term: "人事案件", aliases: ["同意を求める"], description: "人事の議案。" },
  {
    term: "プロポーザル",
    aliases: ["プロポーザル方式"],
    description: "提案で選ぶ方式。",
  },
  { term: "国庫支出金", aliases: ["国県支出金"], description: "国のお金。" },
  {
    term: "返還金",
    aliases: ["国県支出金等返還金"],
    description: "返すお金。",
  },
];

describe("findGlossaryMark", () => {
  it("最初に出てくることばの位置を返す（文末のことばも含む）", () => {
    expect(
      findGlossaryMark(
        "不足は全額を財政調整基金からの繰入れで埋める",
        entries,
        new Set()
      )
    ).toEqual({
      start: 6,
      end: 12,
      entry: entries[1],
    });
    expect(findGlossaryMark("財源は繰入れ", entries, new Set())).toEqual({
      start: 3,
      end: 6,
      entry: entries[2],
    });
    expect(findGlossaryMark("", entries, new Set())).toBeNull();
  });

  it("同じ位置では長いことばを優先し、熟語の一部（財政調整基金の中の基金）には付けない", () => {
    expect(
      findGlossaryMark("財政調整基金を取り崩す", entries, new Set())?.entry.term
    ).toBe("財政調整基金");
    expect(
      findGlossaryMark("国県支出金等返還金を計上", entries, new Set())?.entry
        .term
    ).toBe("返還金");
    expect(findGlossaryMark("基金積立金の増額", entries, new Set())).toBeNull();
    expect(
      findGlossaryMark("一般会計補正予算（第4号）", entries, new Set())
    ).toBeNull();
  });

  it("「案」「額」など熟語にならない字が後ろに付くときは印を付ける", () => {
    expect(
      findGlossaryMark("補正予算案を審議", entries, new Set())?.entry.term
    ).toBe("補正予算");
    expect(
      findGlossaryMark("補正予算額は", entries, new Set())?.entry.term
    ).toBe("補正予算");
  });

  it("かなで終わることばの後ろに漢字が来ても印を付ける", () => {
    expect(
      findGlossaryMark("副市長の選任に同意を求める議案", entries, new Set())
        ?.entry.term
    ).toBe("人事案件");
  });

  it("カタカナのことばはカタカナ語の一部には付けず、長い別表記を優先する", () => {
    expect(
      findGlossaryMark("公募型プロポーザルで", entries, new Set())?.entry.term
    ).toBe("プロポーザル");
    expect(
      findGlossaryMark("プロポーザル方式で選ぶ", entries, new Set())
    ).toEqual({
      start: 0,
      end: 8,
      entry: entries[5],
    });
    expect(
      findGlossaryMark("プロポーザルコンテスト", entries, new Set())
    ).toBeNull();
  });

  it("前後が同じ文字種でなければ印を付ける（別表記も対象）", () => {
    expect(
      findGlossaryMark("この積立金は", entries, new Set())?.entry.term
    ).toBe("基金");
    expect(findGlossaryMark("繰入れで埋める", entries, new Set())).toEqual({
      start: 0,
      end: 3,
      entry: entries[2],
    });
  });

  it("既に印を付けたことばは飛ばす", () => {
    const text = "財政調整基金からの繰入れ";
    expect(
      findGlossaryMark(text, entries, new Set(["財政調整基金"]))?.entry.term
    ).toBe("繰入金");
    expect(
      findGlossaryMark(text, entries, new Set(["財政調整基金", "繰入金"]))
    ).toBeNull();
  });
});
