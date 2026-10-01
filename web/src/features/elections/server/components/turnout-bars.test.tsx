// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatPercent } from "../../shared/utils/turnout";
import {
  BarGroupRow,
  ChartFigure,
  type ChartSeries,
  Meter,
  MeterList,
} from "./turnout-bars";

const SERIES: readonly ChartSeries[] = [
  { label: "今回", kind: "focus" },
  { label: "前回", kind: "context" },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BarGroupRow", () => {
  it("どの系列の値も format でそろえて表示する（添字が桁数に紛れ込まない）", () => {
    render(
      <BarGroupRow
        label="18〜39歳"
        series={SERIES}
        values={[21.94, 16.58]}
        max={50}
        format={formatPercent}
      />
    );
    expect(screen.getByText("21.9%")).toBeInTheDocument();
    expect(screen.getByText("16.6%")).toBeInTheDocument();
  });

  it("読み上げ用の文に系列名と値をまとめ、ツールチップには区分名も入れる", () => {
    const { container } = render(
      <BarGroupRow
        label="20〜24歳"
        sublabel="投票率 33.3%"
        series={SERIES}
        values={[33.32, 40.82]}
        max={100}
        format={formatPercent}
      />
    );
    expect(screen.getByText("今回 33.3%、前回 40.8%")).toBeInTheDocument();
    expect(screen.getByText("投票率 33.3%")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute(
      "title",
      "20〜24歳: 今回 33.3%、前回 40.8%"
    );
  });
});

describe("ChartFigure", () => {
  it("2系列以上のときだけ凡例を出す", () => {
    const { rerender } = render(
      <ChartFigure title="図" series={SERIES} note="注">
        <span>行</span>
      </ChartFigure>
    );
    expect(screen.getByText("前回")).toBeInTheDocument();

    rerender(
      <ChartFigure title="図" series={[SERIES[0]]} note="注">
        <span>行</span>
      </ChartFigure>
    );
    expect(screen.queryByText("今回")).not.toBeInTheDocument();
  });
});

describe("Meter", () => {
  it("割合を指定の桁数で表示する", () => {
    render(<Meter label="平成27年4月" percent={73.17} digits={2} />);
    expect(screen.getByText("73.17%")).toBeInTheDocument();
  });
});

describe("MeterList", () => {
  it("項目ごとに行を出し、React の警告を出さない", () => {
    const consoleError = vi.spyOn(console, "error");
    render(
      <MeterList
        items={[
          { id: "a", label: "第1投票区", percent: 58.48 },
          { id: "b", label: "第2投票区", percent: 61.87 },
        ]}
      />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("58.5%")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
