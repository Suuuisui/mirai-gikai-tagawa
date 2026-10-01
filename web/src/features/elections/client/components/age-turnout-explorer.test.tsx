// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  COUNCIL_ELECTION_2023,
  MAYOR_ELECTION_2026,
} from "../../shared/data/turnout-data";
import { AgeTurnoutExplorer } from "./age-turnout-explorer";

function renderExplorer() {
  render(
    <AgeTurnoutExplorer
      current={MAYOR_ELECTION_2026.ages}
      previous={COUNCIL_ELECTION_2023.ages}
      currentLabel={MAYOR_ELECTION_2026.shortName}
      previousLabel={COUNCIL_ELECTION_2023.shortName}
      overallRate={58.08}
    />
  );
}

describe("AgeTurnoutExplorer", () => {
  it("はじめは20歳・全体の投票率と、令和5年の同じ年齢との差を出す", () => {
    renderExplorer();
    expect(screen.getByText("35.8%")).toBeInTheDocument();
    expect(screen.getByText(/405人のうち/)).toHaveTextContent(
      "405人のうち145人が投票しました。"
    );
    expect(screen.getByText(/同じ20歳の投票率は36\.2%/)).toHaveTextContent(
      "−0.4ポイント"
    );
  });

  it("「女性」を押すと女性の値に切り替わる", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const button = screen.getByRole("button", { name: "女性" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("33.8%")).toBeInTheDocument();
    expect(screen.getByText(/222人のうち/)).toHaveTextContent(
      "222人のうち75人が投票しました。"
    );
    expect(
      screen.getByText(/同じ20歳の女性の投票率は40\.2%/)
    ).toHaveTextContent("−6.4ポイント");
  });
});
