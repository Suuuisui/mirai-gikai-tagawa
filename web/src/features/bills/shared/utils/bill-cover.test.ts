import { describe, expect, test } from "vitest";
import {
  extractBillNumberLabel,
  formatSubmittedYearMonth,
  isDefaultThumbnail,
  pickCoverVariant,
} from "./bill-cover";

describe("extractBillNumberLabel", () => {
  test("議案第N号を抽出する", () => {
    expect(
      extractBillNumberLabel(
        "議案第59号　令和元年度田川市一般会計補正予算（第3号）"
      )
    ).toBe("議案第59号");
  });

  test("認定第N号を抽出する", () => {
    expect(
      extractBillNumberLabel("認定第3号　令和6年度田川市水道事業会計決算認定")
    ).toBe("認定第3号");
  });

  test("報告第N号を抽出する", () => {
    expect(
      extractBillNumberLabel("報告第1号　専決処分の承認を求めることについて")
    ).toBe("報告第1号");
  });

  test("承認第N号を抽出する", () => {
    expect(extractBillNumberLabel("承認第2号　○○について")).toBe("承認第2号");
  });

  test("発議第N号を抽出する", () => {
    expect(extractBillNumberLabel("発議第4号　○○決議")).toBe("発議第4号");
  });

  test("意見書第N号を抽出する", () => {
    expect(extractBillNumberLabel("意見書第5号　○○を求める意見書")).toBe(
      "意見書第5号"
    );
  });

  test("請願第N号を抽出する", () => {
    expect(extractBillNumberLabel("請願第6号　○○に関する請願")).toBe(
      "請願第6号"
    );
  });

  test("陳情第N号を抽出する", () => {
    expect(extractBillNumberLabel("陳情第7号　○○に関する陳情")).toBe(
      "陳情第7号"
    );
  });

  test("諮問第N号を抽出する", () => {
    expect(
      extractBillNumberLabel(
        "諮問第8号　人権擁護委員の推薦につき意見を求めることについて"
      )
    ).toBe("諮問第8号");
  });

  test("先頭以外に番号がある場合はマッチしない", () => {
    expect(extractBillNumberLabel("○○について（議案第10号関連）")).toBeNull();
  });

  test("番号ラベルが無い名称はnullを返す", () => {
    expect(extractBillNumberLabel("田川市一般会計予算に関する説明")).toBeNull();
  });
});

describe("pickCoverVariant", () => {
  test("同じIDであれば常に同じ結果を返す（決定的）", () => {
    const id = "3f9a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b";
    const first = pickCoverVariant(id, 3);
    const second = pickCoverVariant(id, 3);
    expect(first).toBe(second);
  });

  test("0以上variantCount未満の範囲に収まる", () => {
    const ids = [
      "00000000-0000-0000-0000-000000000000",
      "11111111-1111-1111-1111-111111111111",
      "abcdefab-cdef-abcd-efab-cdefabcdefab",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
    ];
    for (const id of ids) {
      const variant = pickCoverVariant(id, 3);
      expect(variant).toBeGreaterThanOrEqual(0);
      expect(variant).toBeLessThan(3);
    }
  });

  test("異なるIDであれば分布に偏りが出すぎない（複数値が出現する）", () => {
    const ids = Array.from(
      { length: 30 },
      (_, i) => `bill-id-sample-${i}-abcdefgh`
    );
    const variants = new Set(ids.map((id) => pickCoverVariant(id, 3)));
    expect(variants.size).toBeGreaterThan(1);
  });

  test("variantCountが0以下の場合は0を返す", () => {
    expect(pickCoverVariant("some-id", 0)).toBe(0);
  });
});

describe("isDefaultThumbnail", () => {
  test("nullの場合はtrue", () => {
    expect(isDefaultThumbnail(null)).toBe(true);
  });

  test("カテゴリ共通のデフォルト画像パスの場合はtrue", () => {
    expect(isDefaultThumbnail("/img/bill-thumbnails/budget.webp")).toBe(true);
  });

  test("個別に差し替えられた画像パスの場合はfalse", () => {
    expect(isDefaultThumbnail("/img/bills/custom-123.webp")).toBe(false);
  });

  test("外部URLの場合はfalse", () => {
    expect(
      isDefaultThumbnail("https://example.com/img/bill-thumbnails/budget.webp")
    ).toBe(false);
  });
});

describe("formatSubmittedYearMonth", () => {
  test("YYYY年M月形式で返す", () => {
    expect(formatSubmittedYearMonth("2026-03-15")).toBe("2026年3月");
  });

  test("1桁月でもゼロ埋めしない", () => {
    expect(formatSubmittedYearMonth("2019-08-01")).toBe("2019年8月");
  });

  test("不正な日付文字列の場合は空文字を返す", () => {
    expect(formatSubmittedYearMonth("invalid-date")).toBe("");
  });
});
