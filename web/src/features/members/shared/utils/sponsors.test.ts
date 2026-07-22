import { describe, expect, it } from "vitest";
import {
  type BillSponsors,
  collectSponsorNames,
  extractFamilyName,
  findUniqueFullName,
  parseBillSponsors,
} from "./sponsors";

function validValue(overrides: Record<string, unknown> = {}) {
  return {
    proposers: [{ name: "髙瀬 冨士夫" }],
    supporters: [{ name: "北山 隆之" }],
    sourceUrl: "https://example.com/proposal.pdf",
    ...overrides,
  };
}

describe("parseBillSponsors", () => {
  it("想定形式の値をそのまま返す", () => {
    const value = validValue();
    expect(parseBillSponsors(value)).toEqual(value);
  });

  it("titleを保持する", () => {
    const value = validValue({
      proposers: [
        { name: "髙瀬 冨士夫" },
        { name: "山田 太郎", title: "総務文教委員会委員長" },
      ],
    });
    expect(parseBillSponsors(value)).toEqual(value);
  });

  it("nullやundefinedはnullを返す", () => {
    expect(parseBillSponsors(null)).toBeNull();
    expect(parseBillSponsors(undefined)).toBeNull();
  });

  it("オブジェクト以外の値はnullを返す", () => {
    expect(parseBillSponsors("text")).toBeNull();
    expect(parseBillSponsors(123)).toBeNull();
    expect(parseBillSponsors([])).toBeNull();
  });

  it("sourceUrlが欠けている/空文字の場合はnullを返す", () => {
    const { sourceUrl, ...withoutSourceUrl } = validValue();
    expect(parseBillSponsors(withoutSourceUrl)).toBeNull();
    expect(parseBillSponsors(validValue({ sourceUrl: "" }))).toBeNull();
  });

  it("proposersが空配列/欠けている場合はnullを返す", () => {
    expect(parseBillSponsors(validValue({ proposers: [] }))).toBeNull();
    const { proposers, ...withoutProposers } = validValue();
    expect(parseBillSponsors(withoutProposers)).toBeNull();
  });

  it("proposersが配列でない場合はnullを返す", () => {
    expect(
      parseBillSponsors(validValue({ proposers: "not-array" }))
    ).toBeNull();
  });

  it("proposersの要素の型が不正な場合はnullを返す", () => {
    expect(
      parseBillSponsors(validValue({ proposers: [{ name: "" }] }))
    ).toBeNull();
    expect(
      parseBillSponsors(validValue({ proposers: [{ title: "委員長" }] }))
    ).toBeNull();
    expect(
      parseBillSponsors(
        validValue({ proposers: [{ name: "山田 太郎", title: 123 }] })
      )
    ).toBeNull();
  });

  it("supportersが省略/nullの場合は空配列として扱う", () => {
    const { supporters, ...withoutSupporters } = validValue();
    expect(parseBillSponsors(withoutSupporters)).toEqual({
      ...withoutSupporters,
      supporters: [],
    });
    expect(parseBillSponsors(validValue({ supporters: null }))).toEqual({
      ...validValue(),
      supporters: [],
    });
  });

  it("supportersの要素の型が不正な場合はnullを返す", () => {
    expect(
      parseBillSponsors(validValue({ supporters: [{ name: "" }] }))
    ).toBeNull();
    expect(
      parseBillSponsors(validValue({ supporters: "not-array" }))
    ).toBeNull();
  });
});

describe("extractFamilyName", () => {
  it("半角スペースより前を姓として返す", () => {
    expect(extractFamilyName("髙瀬 冨士夫")).toBe("髙瀬");
  });

  it("スペースが無ければ全体を返す", () => {
    expect(extractFamilyName("香月")).toBe("香月");
  });

  it("2つ目以降のスペースは無視する", () => {
    expect(extractFamilyName("山田 太郎 二世")).toBe("山田");
  });
});

describe("collectSponsorNames", () => {
  it("proposersとsupportersの氏名を集める", () => {
    const list: BillSponsors[] = [
      {
        proposers: [{ name: "髙瀬 冨士夫" }],
        supporters: [{ name: "北山 隆之" }],
        sourceUrl: "https://example.com/a.pdf",
      },
      {
        proposers: [{ name: "香月 隆一" }],
        supporters: [],
        sourceUrl: "https://example.com/b.pdf",
      },
    ];
    expect(collectSponsorNames(list)).toEqual([
      "髙瀬 冨士夫",
      "北山 隆之",
      "香月 隆一",
    ]);
  });

  it("空配列は空配列を返す", () => {
    expect(collectSponsorNames([])).toEqual([]);
  });
});

describe("findUniqueFullName", () => {
  it("姓に一致するフルネームが1つだけならそれを返す", () => {
    expect(findUniqueFullName(["香月 隆一", "髙瀬 冨士夫"], "香月")).toBe(
      "香月 隆一"
    );
  });

  it("同じフルネームが複数回登場しても1件として扱う", () => {
    expect(
      findUniqueFullName(["香月 隆一", "香月 隆一", "髙瀬 冨士夫"], "香月")
    ).toBe("香月 隆一");
  });

  it("一致が無ければnullを返す", () => {
    expect(findUniqueFullName(["髙瀬 冨士夫"], "香月")).toBeNull();
  });

  it("表記ゆれ等で異なるフルネームが複数見つかった場合はnullを返す", () => {
    expect(findUniqueFullName(["香月 隆一", "香月 隆二"], "香月")).toBeNull();
  });
});
