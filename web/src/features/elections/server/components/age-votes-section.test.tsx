// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MAYOR_ELECTION_2026 } from "../../shared/data/turnout-data";
import { summarizeAges } from "../../shared/utils/turnout";
import { AgeVotesSection } from "./age-votes-section";

function renderSection() {
  return render(
    <AgeVotesSection
      ages={summarizeAges(MAYOR_ELECTION_2026.ages)}
      electionLabel={MAYOR_ELECTION_2026.shortName}
    />
  );
}

describe("AgeVotesSection（令和8年7月の市長選挙）", () => {
  it("1歳ごとの票の最少と最多を、有権者の数と投票率の違いに分けて説明する", () => {
    renderSection();
    expect(
      screen.getByText(
        "1歳ごとに見ると（1歳ごとの数が無い80歳以上は除きます）、票が最も少なかったのは24歳の97票、最も多かったのは77歳の603票で、約6.2倍の開きがあります。有権者の数（329人と855人）で約2.6倍、投票率（29.5%と70.5%）で約2.4倍の違いがあり、その2つが重なった開きです。"
      )
    ).toBeInTheDocument();
  });

  it("5歳ごとの票の数を、有権者の数を添えて14区分並べる", () => {
    renderSection();
    expect(
      screen.getByText("投票した人（票の数） 625票、投票しなかった人 1,251人")
    ).toBeInTheDocument();
    expect(screen.getByText("有権者1,876人")).toBeInTheDocument();
    expect(
      screen.getAllByText(/^投票した人（票の数） [\d,]+票、/)
    ).toHaveLength(14);
  });

  it("棒の目盛りは有権者の最大（80歳以上の5,121人）を千人単位で切り上げる", () => {
    renderSection();
    expect(
      screen.getByText(/棒の長さは0〜6,000人で表しています/)
    ).toBeInTheDocument();
  });

  it("表の各行に票の数・票全体に占める割合・投票しなかった人・有権者を出す", () => {
    renderSection();
    const row = screen
      .getByRole("rowheader", { name: "75〜79歳" })
      .closest("tr");
    expect(row).toHaveTextContent(/2,588票\s*12\.4%\s*1,256人\s*3,844人/);
  });

  it("表の合計は投票した人と有権者の合計に一致する", () => {
    renderSection();
    const totalRow = screen
      .getByRole("rowheader", { name: "計" })
      .closest("tr");
    expect(totalRow).toHaveTextContent("20,817票");
    expect(totalRow).toHaveTextContent("15,022人");
    expect(totalRow).toHaveTextContent("35,839人");
  });
});
