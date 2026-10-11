import { describe, expect, it } from "vitest";
import {
  PROPOSER_DESCRIPTIONS,
  PROPOSER_LABELS,
  PROPOSER_TYPES,
} from "@/features/members/shared/utils/proposer";
import {
  describeMember,
  describeProposerBills,
  describeQuestionSession,
  describeSessionBills,
  describeSessionSummary,
  describeTagBills,
  formatDateRange,
  PAGE_COPY,
} from "./page-copy";
import {
  countCharacters,
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
} from "./page-description";

/** 題名の長さの上限。サイト名（約 12 字）が後ろに付いても検索結果で内容が分かるように */
const TITLE_MAX_LENGTH = 40;

function expectDescriptionLength(description: string) {
  const length = countCharacters(description);
  expect(length).toBeGreaterThanOrEqual(DESCRIPTION_MIN_LENGTH);
  expect(length).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH);
}

describe("PAGE_COPY（内容が固定のページ）", () => {
  const entries = Object.entries(PAGE_COPY);

  for (const [name, copy] of entries) {
    it(`${name}: 説明は 80〜120 字、題名は ${TITLE_MAX_LENGTH} 字以内`, () => {
      expectDescriptionLength(copy.description);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(countCharacters(copy.title)).toBeLessThanOrEqual(TITLE_MAX_LENGTH);
    });
  }

  it("ページごとに題名も説明も違う（検索結果で同じ表示が並ばない）", () => {
    const titles = entries.map(([, copy]) => copy.title);
    const descriptions = entries.map(([, copy]) => copy.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe("formatDateRange", () => {
  it("同じ年の期間は終わりの年を省く", () => {
    expect(formatDateRange("2026-09-07", "2026-10-08")).toBe(
      "2026年9月7日〜10月8日"
    );
  });

  it("1 日だけの会期は日付を 1 つだけ書く", () => {
    expect(formatDateRange("2026-08-10", "2026-08-10")).toBe("2026年8月10日");
  });

  it("年をまたぐ期間は両方の年を書く", () => {
    expect(formatDateRange("2025-12-25", "2026-01-10")).toBe(
      "2025年12月25日〜2026年1月10日"
    );
  });
});

describe("describeSessionSummary / describeSessionBills", () => {
  const regular = {
    name: "令和8年（第6回）9月定例会",
    startDate: "2026-09-07",
    endDate: "2026-10-08",
    billCount: 26,
  };
  const oneDay = {
    name: "令和8年（第5回）8月臨時会",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    billCount: 5,
  };

  it("会期まとめの説明に会期名・期間・議案数が入り、80〜120 字に収まる", () => {
    for (const input of [regular, oneDay]) {
      const description = describeSessionSummary(input);
      expectDescriptionLength(description);
      expect(description).toContain(input.name);
      expect(description).toContain(`${input.billCount}件`);
    }
    expect(describeSessionSummary(regular)).toContain("2026年9月7日〜10月8日");
  });

  it("会期別の議案一覧の説明も 80〜120 字に収まる", () => {
    for (const input of [regular, oneDay]) {
      expectDescriptionLength(describeSessionBills(input));
    }
    expect(describeSessionBills(regular)).toContain("議案26件の一覧");
  });

  it("議案数が 0 のときは件数を書かない", () => {
    const empty = { ...regular, billCount: 0 };
    expect(describeSessionSummary(empty)).not.toContain("0件");
    expect(describeSessionBills(empty)).not.toContain("0件");
  });
});

describe("describeTagBills", () => {
  it("タグの一言説明があれば添え、80〜120 字に収まる", () => {
    const description = describeTagBills({
      label: "決算",
      description: "前年度の税金の使われ方が適切だったかを審査する決算案",
      billCount: 39,
    });
    expectDescriptionLength(description);
    expect(description).toContain(
      "「決算」（前年度の税金の使われ方が適切だったかを審査する決算案）に関するもの39件"
    );
  });

  it("一言説明が無いタグも 80 字以上になる", () => {
    const description = describeTagBills({
      label: "契約・工事",
      description: null,
      billCount: 12,
    });
    expectDescriptionLength(description);
    expect(description).not.toContain("null");
  });

  it("一言説明が「。」で終わっていても句点を重ねない", () => {
    const description = describeTagBills({
      label: "予算",
      description: "毎年度の市の使いみちを決める予算案。",
      billCount: 3,
    });
    expect(description).not.toContain("。。");
  });

  it("一言説明が長くても 120 字を超えない", () => {
    const description = describeTagBills({
      label: "決議",
      description: "あ".repeat(200),
      billCount: 8,
    });
    expect(countCharacters(description)).toBeLessThanOrEqual(
      DESCRIPTION_MAX_LENGTH
    );
  });
});

describe("describeProposerBills", () => {
  // 件数の桁が変わる境目で文の長さが変わるので、桁ごとに見る
  const BILL_COUNTS = [1, 9, 10, 15, 99, 100, 541, 9999];

  for (const proposer of PROPOSER_TYPES) {
    it(`${PROPOSER_LABELS[proposer]}: どの件数でも 80〜120 字で、「。」で終わり、文の途中で切れない`, () => {
      for (const billCount of BILL_COUNTS) {
        const description = describeProposerBills({
          label: PROPOSER_LABELS[proposer],
          description: PROPOSER_DESCRIPTIONS[proposer],
          billCount,
        });
        expectDescriptionLength(description);
        expect(description.endsWith("。")).toBe(true);
        expect(description).not.toContain("…");
      }
    });
  }

  it("提出者区分の名前と件数が入り、区分の説明は文の切れ目で添える", () => {
    const description = describeProposerBills({
      label: PROPOSER_LABELS.member,
      description: PROPOSER_DESCRIPTIONS.member,
      billCount: 86,
    });
    expect(
      description.startsWith("田川市議会の議員提出議案を一覧できます。")
    ).toBe(true);
    expect(description).toContain("議決日の新しい順に86件を掲載しています。");
    expect(description).toContain(PROPOSER_DESCRIPTIONS.member);
  });
});

describe("describeMember", () => {
  it("賛否の数が評価ではないことを添え、80〜120 字に収まる", () => {
    const description = describeMember({
      displayName: "榊原 大祐",
      voteCount: 78,
    });
    expectDescriptionLength(description);
    expect(description).toContain("榊原 大祐 議員");
    expect(description).toContain("78議案");
    expect(description).toContain("評価を示すものではありません");
  });

  it("賛否の記録が無い議員は議案数を書かない", () => {
    const description = describeMember({
      displayName: "世羅 翔二郎",
      voteCount: 0,
    });
    expect(description).not.toContain("0議案");
    expectDescriptionLength(description);
  });
});

describe("describeQuestionSession", () => {
  const name = "令和8年（第6回）9月定例会";

  it("質問者の名前を並べ、120 字に収まる", () => {
    const members = [
      "山野 義人",
      "榊原 大祐",
      "田守 健治",
      "世羅 翔二郎",
      "小林 義憲",
      "石松 和幸",
      "尾﨑 行人",
      "今村 寿人",
      "柿田 孝子",
      "永松 広宣",
      "村吉 勇介",
      "香月 隆一",
      "梶原 みつ子",
      "佐藤 俊一",
    ];
    const description = describeQuestionSession({
      sessionName: name,
      memberNames: members,
    });
    expect(countCharacters(description)).toBeLessThanOrEqual(
      DESCRIPTION_MAX_LENGTH
    );
    expect(description).toContain("14人の議員が通告した一般質問");
    expect(description).toContain("山野 義人・榊原 大祐");

    // 入りきらなかった人数が「ほかN人」で分かる（載せた人数 + N = 14）
    const omitted = description.match(/ほか(\d+)人$/);
    expect(omitted).not.toBeNull();
    const shown = description
      .split("質問者: ")[1]
      .replace(/ほか\d+人$/, "")
      .split("・");
    expect(shown.length + Number(omitted?.[1])).toBe(members.length);
  });

  it("質問者が少ないときは全員の名前を載せる", () => {
    const description = describeQuestionSession({
      sessionName: "平成29年（第1回）3月定例会",
      memberNames: ["山野 義人", "榊原 大祐"],
    });
    expect(description).toContain("山野 義人・榊原 大祐");
    expect(description).not.toContain("ほか");
  });
});
