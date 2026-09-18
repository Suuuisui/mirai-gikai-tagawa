import { describe, expect, it } from "vitest";
import type { CurationBill } from "../types";
import {
  filterCandidateBills,
  limitCandidateBills,
} from "./filter-candidate-bills";

function createBill(overrides: Partial<CurationBill> & { id: string }) {
  return {
    name: "議案第1号　テスト条例",
    title: null,
    statusNote: null,
    isControversial: false,
    submittedDate: "2026-09-07",
    sessionId: "session-latest",
    sessionName: "令和8年（第6回）9月定例会",
    tags: [],
    interestScore: 0,
    isHot: false,
    ...overrides,
  } satisfies CurationBill;
}

const latestBudget = createBill({
  id: "latest-budget",
  name: "議案第50号　令和8年度田川市一般会計補正予算",
  title: "9月の補正予算",
  tags: [{ id: "tag-budget", label: "予算" }],
});
const previousOrdinance = createBill({
  id: "previous-ordinance",
  name: "議員提出議案第59号　田川市議会委員会条例の一部改正について",
  title: "委員会の定数を変える",
  sessionId: "session-previous",
  sessionName: "令和8年（第5回）8月臨時会",
  tags: [{ id: "tag-ordinance", label: "条例" }],
});
const noSessionBill = createBill({
  id: "no-session",
  name: "議案第2号　会期未設定の議案",
  sessionId: null,
  sessionName: null,
  tags: [{ id: "tag-opinion", label: "意見書" }],
});
const bills = [latestBudget, previousOrdinance, noSessionBill];

describe("filterCandidateBills", () => {
  it("条件なしなら全件をそのままの順で返す", () => {
    expect(
      filterCandidateBills(bills, { keyword: "", sessionId: null })
    ).toEqual(bills);
  });

  it("キーワードを省略すると会期の条件だけで絞り込む", () => {
    expect(filterCandidateBills(bills, { sessionId: null })).toEqual(bills);
    expect(
      filterCandidateBills(bills, { sessionId: "session-previous" }).map(
        (bill) => bill.id
      )
    ).toEqual(["previous-ordinance"]);
  });

  it("空白だけのキーワードは条件なしとして扱う", () => {
    expect(
      filterCandidateBills(bills, { keyword: "  　 ", sessionId: null })
    ).toEqual(bills);
  });

  it("該当する議案が無い会期IDなら空配列を返す", () => {
    expect(
      filterCandidateBills(bills, { keyword: "", sessionId: "session-none" })
    ).toEqual([]);
  });

  it("会期IDで絞り込むと、その会期の議案だけが残る", () => {
    const result = filterCandidateBills(bills, {
      keyword: "",
      sessionId: "session-latest",
    });
    expect(result.map((bill) => bill.id)).toEqual(["latest-budget"]);
  });

  it("会期を指定すると会期未設定の議案は除外される", () => {
    const result = filterCandidateBills(bills, {
      keyword: "",
      sessionId: "session-previous",
    });
    expect(result.map((bill) => bill.id)).toEqual(["previous-ordinance"]);
  });

  it("キーワードは会期名にも一致する", () => {
    const result = filterCandidateBills(bills, {
      keyword: "9月定例会",
      sessionId: null,
    });
    expect(result.map((bill) => bill.id)).toEqual(["latest-budget"]);
  });

  it("キーワードは議案名・タイトル・タグ名のいずれかに一致すればよい", () => {
    const byName = filterCandidateBills(bills, {
      keyword: "委員会条例",
      sessionId: null,
    });
    const byTitle = filterCandidateBills(bills, {
      keyword: "9月の補正",
      sessionId: null,
    });
    // 「意見書」は議案名には含まれず、タグ名だけに一致する
    const byTag = filterCandidateBills(bills, {
      keyword: "意見書",
      sessionId: null,
    });
    expect(byName.map((bill) => bill.id)).toEqual(["previous-ordinance"]);
    expect(byTitle.map((bill) => bill.id)).toEqual(["latest-budget"]);
    expect(byTag.map((bill) => bill.id)).toEqual(["no-session"]);
  });

  it("タイトルや会期名が未設定（null）の議案も、議案名で検索できる", () => {
    const result = filterCandidateBills(bills, {
      keyword: "会期未設定",
      sessionId: null,
    });
    expect(result.map((bill) => bill.id)).toEqual(["no-session"]);
  });

  it("全角・半角や大文字・小文字の違いを無視して一致させる", () => {
    const fullWidthName = createBill({
      id: "full-width",
      name: "議案第７号　令和８年度田川市一般会計予算",
      sessionId: "session-previous",
      sessionName: "令和8年（第2回）3月定例会",
    });
    const halfWidthKeyword = filterCandidateBills([fullWidthName], {
      keyword: "令和8年度",
      sessionId: null,
    });
    const fullWidthKeyword = filterCandidateBills([fullWidthName], {
      keyword: "（第２回）",
      sessionId: null,
    });
    const upperCaseKeyword = filterCandidateBills(
      [createBill({ id: "ascii", name: "議案第1号　DX推進計画について" })],
      { keyword: "dx推進", sessionId: null }
    );
    expect(halfWidthKeyword.map((bill) => bill.id)).toEqual(["full-width"]);
    expect(fullWidthKeyword.map((bill) => bill.id)).toEqual(["full-width"]);
    expect(upperCaseKeyword.map((bill) => bill.id)).toEqual(["ascii"]);
  });

  it("キーワードの前後の空白は無視する", () => {
    const result = filterCandidateBills(bills, {
      keyword: "  補正予算  ",
      sessionId: null,
    });
    expect(result.map((bill) => bill.id)).toEqual(["latest-budget"]);
  });

  it("会期とキーワードは両方満たす議案だけを返す", () => {
    const matched = filterCandidateBills(bills, {
      keyword: "予算",
      sessionId: "session-latest",
    });
    const unmatched = filterCandidateBills(bills, {
      keyword: "条例",
      sessionId: "session-latest",
    });
    expect(matched.map((bill) => bill.id)).toEqual(["latest-budget"]);
    expect(unmatched).toEqual([]);
  });
});

describe("limitCandidateBills", () => {
  it("全会期のときは上限までを表示し、残りの件数を返す", () => {
    const { visible, hiddenCount } = limitCandidateBills(bills, null, 2);
    expect(visible.map((bill) => bill.id)).toEqual([
      "latest-budget",
      "previous-ordinance",
    ]);
    expect(hiddenCount).toBe(1);
  });

  it("上限に満たなければ全件を表示し、隠れた件数は0になる", () => {
    const { visible, hiddenCount } = limitCandidateBills(bills, null, 10);
    expect(visible).toEqual(bills);
    expect(hiddenCount).toBe(0);
  });

  it("会期で絞り込んでいるときは上限を掛けない", () => {
    const { visible, hiddenCount } = limitCandidateBills(
      bills,
      "session-latest",
      1
    );
    expect(visible).toEqual(bills);
    expect(hiddenCount).toBe(0);
  });
});
