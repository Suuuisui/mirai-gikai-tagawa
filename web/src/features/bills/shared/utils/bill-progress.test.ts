import { describe, expect, test } from "vitest";
import {
  calculateProgressWidth,
  getBaseSteps,
  getCurrentStep,
  getOrderedSteps,
  getStatusMessage,
  getStepState,
} from "./bill-progress";

const BASE_STEPS = [
  { label: "議案\n提出" },
  { label: "委員会\n審査" },
  { label: "本会議\n議決" },
  { label: "議案\n成立" },
] as const;

describe("getStatusMessage", () => {
  test("preparing の場合は '議案提出前' を返す", () => {
    expect(getStatusMessage("preparing", null)).toBe("議案提出前");
  });

  test("preparing の場合は statusNote があっても '議案提出前' を返す", () => {
    expect(getStatusMessage("preparing", "審議中メモ")).toBe("議案提出前");
  });

  test("preparing 以外で statusNote がある場合はそれを返す", () => {
    expect(getStatusMessage("introduced", "委員会で審議中")).toBe(
      "委員会で審議中"
    );
  });

  test("preparing 以外で statusNote が null の場合は空文字を返す", () => {
    expect(getStatusMessage("enacted", null)).toBe("");
  });

  test("preparing 以外で statusNote が undefined の場合は空文字を返す", () => {
    expect(getStatusMessage("rejected", undefined)).toBe("");
  });
});

describe("getStepState", () => {
  test("isPreparing が true の場合は常に inactive", () => {
    expect(getStepState(1, 0, true)).toBe("inactive");
    expect(getStepState(2, 2, true)).toBe("inactive");
    expect(getStepState(4, 4, true)).toBe("inactive");
  });

  test("stepNumber が currentStep 以下の場合は active", () => {
    expect(getStepState(1, 2, false)).toBe("active");
    expect(getStepState(2, 2, false)).toBe("active");
    expect(getStepState(1, 4, false)).toBe("active");
  });

  test("stepNumber が currentStep より大きい場合は inactive", () => {
    expect(getStepState(3, 2, false)).toBe("inactive");
    expect(getStepState(4, 1, false)).toBe("inactive");
  });
});

describe("getOrderedSteps", () => {
  test("HR(委員会)の場合はステップ順序がそのまま", () => {
    const result = getOrderedSteps("HR", BASE_STEPS);
    expect(result[0].label).toBe("議案\n提出");
    expect(result[1].label).toBe("委員会\n審査");
    expect(result[2].label).toBe("本会議\n議決");
    expect(result[3].label).toBe("議案\n成立");
  });

  test("HC(本会議)の場合はステップ2と3が入れ替わる", () => {
    const result = getOrderedSteps("HC", BASE_STEPS);
    expect(result[0].label).toBe("議案\n提出");
    expect(result[1].label).toBe("本会議\n議決");
    expect(result[2].label).toBe("委員会\n審査");
    expect(result[3].label).toBe("議案\n成立");
  });

  test("元の配列を変更しない", () => {
    const original = [...BASE_STEPS.map((s) => ({ ...s }))];
    getOrderedSteps("HC", BASE_STEPS);
    expect(BASE_STEPS[1].label).toBe(original[1].label);
    expect(BASE_STEPS[2].label).toBe(original[2].label);
  });
});

describe("calculateProgressWidth", () => {
  test("ステップ0は0%", () => {
    expect(calculateProgressWidth(0)).toBe(0);
  });

  test("ステップ1は12.5%", () => {
    expect(calculateProgressWidth(1)).toBe(12.5);
  });

  test("ステップ2は37.5%", () => {
    expect(calculateProgressWidth(2)).toBe(37.5);
  });

  test("ステップ3は62.5%", () => {
    expect(calculateProgressWidth(3)).toBe(62.5);
  });

  test("ステップ4は100%", () => {
    expect(calculateProgressWidth(4)).toBe(100);
  });

  test("範囲外のステップは0%", () => {
    expect(calculateProgressWidth(5)).toBe(0);
    expect(calculateProgressWidth(-1)).toBe(0);
  });
});

describe("getBaseSteps", () => {
  test("rejected 以外は最終ステップが '議案\\n成立'", () => {
    expect(getBaseSteps("enacted")[3].label).toBe("議案\n成立");
    expect(getBaseSteps("introduced")[3].label).toBe("議案\n成立");
    expect(getBaseSteps("preparing")[3].label).toBe("議案\n成立");
  });

  test("rejected の場合は最終ステップが '審議\\n終了'", () => {
    expect(getBaseSteps("rejected")[3].label).toBe("審議\n終了");
  });

  test("最終ステップ以外のラベルはステータスによらず共通", () => {
    const enacted = getBaseSteps("enacted");
    const rejected = getBaseSteps("rejected");
    expect(rejected[0].label).toBe(enacted[0].label);
    expect(rejected[1].label).toBe(enacted[1].label);
    expect(rejected[2].label).toBe(enacted[2].label);
  });
});

describe("getCurrentStep", () => {
  test("preparing は 0", () => {
    expect(getCurrentStep("preparing")).toBe(0);
  });

  test("introduced は 1", () => {
    expect(getCurrentStep("introduced")).toBe(1);
  });

  test("in_originating_house は 2", () => {
    expect(getCurrentStep("in_originating_house")).toBe(2);
  });

  test("in_receiving_house は 3", () => {
    expect(getCurrentStep("in_receiving_house")).toBe(3);
  });

  test("enacted は 4", () => {
    expect(getCurrentStep("enacted")).toBe(4);
  });

  test("rejected は 4", () => {
    expect(getCurrentStep("rejected")).toBe(4);
  });
});
