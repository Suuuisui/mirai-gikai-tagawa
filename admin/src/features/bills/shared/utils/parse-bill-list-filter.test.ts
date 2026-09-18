import { describe, expect, it } from "vitest";
import { parseBillListFilter } from "./parse-bill-list-filter";

describe("parseBillListFilter", () => {
  it("会期がUUIDならそのまま採用する（大文字も可）", () => {
    expect(
      parseBillListFilter({
        dietSession: "3538040a-750d-594a-8464-084c914532cd",
      })
    ).toEqual({ dietSessionId: "3538040a-750d-594a-8464-084c914532cd" });
    expect(
      parseBillListFilter({
        dietSession: "3538040A-750D-594A-8464-084C914532CD",
      })
    ).toEqual({ dietSessionId: "3538040A-750D-594A-8464-084C914532CD" });
  });

  it("未指定・all・UUIDでない値は絞り込みなし", () => {
    expect(parseBillListFilter({})).toEqual({ dietSessionId: null });
    expect(parseBillListFilter({ dietSession: "" })).toEqual({
      dietSessionId: null,
    });
    expect(parseBillListFilter({ dietSession: "all" })).toEqual({
      dietSessionId: null,
    });
    expect(parseBillListFilter({ dietSession: "r8-6-teirei" })).toEqual({
      dietSessionId: null,
    });
  });
});
