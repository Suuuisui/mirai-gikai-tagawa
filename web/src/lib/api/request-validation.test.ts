import { describe, expect, it } from "vitest";
import { z } from "zod";
import { failValidation, getStatusFromZodError } from "./request-validation";

const schema = z.object({
  items: z.array(z.string()).max(2),
  name: z.string().max(3),
});

function getError(input: unknown): z.ZodError {
  const result = schema.safeParse(input);
  if (result.success) {
    throw new Error("検証が成功してしまった");
  }
  return result.error;
}

describe("getStatusFromZodError", () => {
  it("上限超過（too_big）だけなら 413", () => {
    const error = getError({ items: ["a", "b", "c"], name: "ok" });
    expect(getStatusFromZodError(error)).toBe(413);
  });

  it("複数の項目が上限超過でも 413", () => {
    const error = getError({ items: ["a", "b", "c"], name: "long-name" });
    expect(getStatusFromZodError(error)).toBe(413);
  });

  it("型の誤りだけなら 400", () => {
    const error = getError({ items: "not-array", name: "ok" });
    expect(getStatusFromZodError(error)).toBe(400);
  });

  it("上限超過と型の誤りが混ざっていれば 400（形式の誤りを優先）", () => {
    const error = getError({ items: "not-array", name: "long-name" });
    expect(getStatusFromZodError(error)).toBe(400);
  });
});

describe("failValidation", () => {
  it("ステータスとメッセージを持つ失敗結果を返す", () => {
    expect(failValidation(413, "大きすぎます")).toEqual({
      success: false,
      status: 413,
      message: "大きすぎます",
    });
  });
});
