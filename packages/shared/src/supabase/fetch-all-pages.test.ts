import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./fetch-all-pages";

const makeSource = (total: number) => {
  const calls: Array<[number, number]> = [];
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to]);
    const rows = Array.from({ length: total }, (_, i) => i).slice(from, to + 1);
    return { data: rows, error: null };
  };
  return { calls, fetchPage };
};

describe("fetchAllPages", () => {
  it("1ページに収まる件数は1回で返す", async () => {
    const { calls, fetchPage } = makeSource(3);
    const { data } = await fetchAllPages(fetchPage, 10);
    expect(data).toEqual([0, 1, 2]);
    expect(calls).toEqual([[0, 9]]);
  });

  it("ページサイズを超える件数を最後まで取得する", async () => {
    const { fetchPage } = makeSource(25);
    const { data, error } = await fetchAllPages(fetchPage, 10);
    expect(error).toBeNull();
    expect(data).toHaveLength(25);
    expect(data?.[24]).toBe(24);
  });

  it("ちょうどページサイズの倍数でも空ページで止まる", async () => {
    const { calls, fetchPage } = makeSource(20);
    const { data } = await fetchAllPages(fetchPage, 10);
    expect(data).toHaveLength(20);
    expect(calls).toHaveLength(3);
  });

  it("0件なら空配列", async () => {
    const { fetchPage } = makeSource(0);
    expect((await fetchAllPages(fetchPage, 10)).data).toEqual([]);
  });

  it("途中でエラーになったらそのエラーを返す", async () => {
    let n = 0;
    const result = await fetchAllPages<number>(async () => {
      n += 1;
      if (n === 2) return { data: null, error: { message: "boom" } };
      return { data: Array.from({ length: 10 }, (_, i) => i), error: null };
    }, 10);
    expect(result).toEqual({ data: null, error: { message: "boom" } });
  });
});
